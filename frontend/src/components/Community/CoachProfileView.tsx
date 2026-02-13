import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { CoachProfile, CommunityPost } from '@/types'
import PostCard from './PostCard'
import { ArrowLeft, UserCircle, UserPlus, UserMinus, MessageCircle } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  userId: number
  onBack: () => void
  onChatRequest: (userId: number) => void
}

const sportLabels: Record<string, string> = { football: 'Calcio', basketball: 'Basket', volleyball: 'Pallavolo' }
const levelLabels: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzato', professional: 'Professionista' }

export default function CoachProfileView({ userId, onBack, onChatRequest }: Props) {
  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/community/profile/${userId}`).then(({ data }) => {
      setProfile(data.profile)
      setPosts(data.posts)
      setLoading(false)
    })
  }, [userId])

  const toggleFollow = async () => {
    if (!profile) return
    const { data } = await api.post(`/community/follow/${userId}`)
    setProfile(p => p ? { ...p, is_following: data.following, followers_count: p.followers_count + (data.following ? 1 : -1) } : p)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" /></div>

  if (!profile) return null

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1">
        <ArrowLeft size={16} /> Torna alla community
      </button>

      {/* Profile header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-20 h-20 rounded-full object-cover" /> : <UserCircle size={40} className="text-brand-600" />}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sportLabels[profile.sport || ''] || profile.sport}
              {profile.coaching_level && ` · ${levelLabels[profile.coaching_level] || profile.coaching_level}`}
              {profile.years_experience && ` · ${profile.years_experience} anni exp.`}
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span><strong>{profile.posts_count}</strong> post</span>
              <span><strong>{profile.followers_count}</strong> follower</span>
              <span><strong>{profile.following_count}</strong> seguiti</span>
            </div>
          </div>
          {!profile.is_self && (
            <div className="flex gap-2">
              <button onClick={toggleFollow}
                className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  profile.is_following ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'bg-brand-500 text-white')}>
                {profile.is_following ? <><UserMinus size={16} /> Seguendo</> : <><UserPlus size={16} /> Segui</>}
              </button>
              <button onClick={() => onChatRequest(userId)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                <MessageCircle size={16} /> Messaggio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post}
            onLikeToggle={(id, liked, count) => setPosts(prev => prev.map(p => p.id === id ? { ...p, liked, likes_count: count } : p))}
            onSaveToggle={(id, saved, count) => setPosts(prev => prev.map(p => p.id === id ? { ...p, saved, saves_count: count } : p))}
            onProfileClick={() => {}} />
        ))}
        {posts.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Nessun post ancora</p>}
      </div>
    </div>
  )
}
