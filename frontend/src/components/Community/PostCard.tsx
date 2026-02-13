import { useState } from 'react'
import api from '@/api/client'
import type { CommunityPost, CommunityComment } from '@/types'
import { useAuthStore } from '@/store/auth'
import { useTeamStore } from '@/store/team'
import { useToastStore } from '@/store/toast'
import {
  Heart, MessageCircle, Bookmark, Share2, Trash2, Clock,
  Dumbbell, UserCircle, Download, ChevronDown, ChevronUp, Send
} from 'lucide-react'
import clsx from 'clsx'

interface Props {
  post: CommunityPost
  onLikeToggle: (postId: number, liked: boolean, count: number) => void
  onSaveToggle: (postId: number, saved: boolean, count: number) => void
  onDelete?: (postId: number) => void
  onProfileClick: (userId: number) => void
}

const sportLabels: Record<string, string> = { football: 'Calcio', basketball: 'Basket', volleyball: 'Pallavolo' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}g`
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export default function PostCard({ post, onLikeToggle, onSaveToggle, onDelete, onProfileClick }: Props) {
  const { user } = useAuthStore()
  const { activeTeamId } = useTeamStore()
  const toast = useToastStore()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [showTrainingDetail, setShowTrainingDetail] = useState(false)

  const handleLike = async () => {
    const { data } = await api.post(`/community/posts/${post.id}/like`)
    onLikeToggle(post.id, data.liked, data.likes_count)
  }

  const handleSave = async () => {
    const { data } = await api.post(`/community/posts/${post.id}/save`)
    onSaveToggle(post.id, data.saved, data.saves_count)
  }

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return }
    setLoadingComments(true)
    const { data } = await api.get(`/community/posts/${post.id}/comments`)
    setComments(data.comments)
    setShowComments(true)
    setLoadingComments(false)
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    const { data } = await api.post(`/community/posts/${post.id}/comments`, { text: newComment })
    setComments(prev => [...prev, data.comment])
    setNewComment('')
  }

  const deleteComment = async (id: number) => {
    await api.delete(`/community/comments/${id}`)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const importTraining = async () => {
    if (!activeTeamId) { toast.error('Seleziona un team prima'); return }
    try {
      await api.post(`/community/posts/${post.id}/import-training`, { team_id: activeTeamId })
      toast.success('Allenamento importato nel tuo builder!')
    } catch { toast.error('Errore nell\'importazione') }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <button onClick={() => onProfileClick(post.author_id)}
          className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold shrink-0">
          {post.author_avatar ? <img src={post.author_avatar} className="w-10 h-10 rounded-full object-cover" /> : <UserCircle size={24} />}
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => onProfileClick(post.author_id)} className="font-semibold text-sm hover:underline">{post.author_name}</button>
          <p className="text-xs text-gray-400">{sportLabels[post.author_sport || ''] || post.author_sport} · {timeAgo(post.created_at)}</p>
        </div>
        {post.author_id === user?.id && onDelete && (
          <button onClick={() => onDelete(post.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {post.content && <p className="text-sm whitespace-pre-wrap">{post.content}</p>}

        {/* Shared exercise */}
        {post.post_type === 'exercise' && post.shared_exercise && (
          <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Esercizio condiviso</span>
            </div>
            <p className="font-semibold text-sm">{String(post.shared_exercise.name || '')}</p>
            {post.shared_exercise.description ? <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{String(post.shared_exercise.description)}</p> : null}
            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              {post.shared_exercise.duration_minutes ? <span className="flex items-center gap-1"><Clock size={12} /> {String(post.shared_exercise.duration_minutes)} min</span> : null}
              {post.shared_exercise.intensity ? <span className="capitalize">{String(post.shared_exercise.intensity)}</span> : null}
            </div>
          </div>
        )}

        {/* Shared training */}
        {post.post_type === 'training' && post.shared_training_data && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell size={14} className="text-green-600" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Allenamento condiviso</span>
                </div>
                <p className="font-semibold text-sm">{post.shared_training_data.title || 'Allenamento'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {post.shared_training_data.duration_minutes && `${post.shared_training_data.duration_minutes} min · `}
                  {post.shared_training_data.blocks?.length || 0} blocchi
                </p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setShowTrainingDetail(!showTrainingDetail)}
                  className="p-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg text-xs">
                  {showTrainingDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button onClick={importTraining}
                  className="p-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg text-xs flex items-center gap-1">
                  <Download size={14} /> Importa
                </button>
              </div>
            </div>
            {showTrainingDetail && post.shared_training_data.blocks && (
              <div className="mt-3 space-y-1.5 border-t border-green-200 dark:border-green-800 pt-2">
                {post.shared_training_data.blocks.map((block, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="font-medium">{String(block.name || '')}</span>
                    {block.duration_minutes ? <span className="text-gray-400">{String(block.duration_minutes)}m</span> : null}
                    {block.intensity ? <span className="text-gray-400 capitalize">{String(block.intensity)}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Image */}
        {post.image_url && (
          <img src={post.image_url} alt="" className="mt-3 rounded-xl w-full max-h-96 object-cover" />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-800">
        <button onClick={handleLike} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
          post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500')}>
          <Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />
          {post.likes_count > 0 && <span className="text-xs font-medium">{post.likes_count}</span>}
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-blue-500 transition-colors">
          <MessageCircle size={18} />
          {post.comments_count > 0 && <span className="text-xs font-medium">{post.comments_count}</span>}
        </button>
        <button onClick={handleSave} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
          post.saved ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500')}>
          <Bookmark size={18} fill={post.saved ? 'currentColor' : 'none'} />
        </button>
        <div className="flex-1" />
        <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/community?post=${post.id}`); toast.success('Link copiato!') }}
          className="p-1.5 text-gray-400 hover:text-gray-600">
          <Share2 size={16} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <UserCircle size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs">
                  <span className="font-semibold">{c.author_name}</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">{c.text}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{timeAgo(c.created_at)}</span>
                  {c.author_id === user?.id && (
                    <button onClick={() => deleteComment(c.id)} className="text-[10px] text-red-400 hover:text-red-600">Elimina</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input className="input-field text-sm flex-1" placeholder="Scrivi un commento..."
              value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()} />
            <button onClick={submitComment} className="p-2 text-brand-600 hover:text-brand-700"><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
