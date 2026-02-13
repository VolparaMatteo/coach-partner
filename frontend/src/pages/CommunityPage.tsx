import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { CommunityPost } from '@/types'
import { useToastStore } from '@/store/toast'
import PostCard from '@/components/Community/PostCard'
import CreatePost from '@/components/Community/CreatePost'
import CoachProfileView from '@/components/Community/CoachProfileView'
import EmptyState from '@/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/components/Skeleton/Skeleton'
import { Globe, Compass, Bookmark, Search, Plus, Users, UserPlus } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'feed' | 'discover' | 'saved' | 'coaches'

interface CoachResult {
  id: number
  name: string
  avatar_url: string | null
  sport: string | null
  coaching_level: string | null
  is_following: boolean
}

const sportLabels: Record<string, string> = { football: 'Calcio', basketball: 'Basket', volleyball: 'Pallavolo' }

export default function CommunityPage() {
  const toast = useToastStore()
  const [tab, setTab] = useState<Tab>('feed')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)
  const [coaches, setCoaches] = useState<CoachResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchingCoaches, setSearchingCoaches] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [tab])

  const loadPosts = async () => {
    if (tab === 'coaches') return
    setLoading(true)
    try {
      let endpoint = '/community/feed'
      if (tab === 'discover') endpoint = '/community/discover'
      if (tab === 'saved') endpoint = '/community/saved'
      const { data } = await api.get(endpoint)
      setPosts(data.posts)
    } catch {}
    setLoading(false)
  }

  const searchCoaches = async (q: string) => {
    setSearchingCoaches(true)
    const { data } = await api.get(`/community/coaches?q=${encodeURIComponent(q)}`)
    setCoaches(data.coaches)
    setSearchingCoaches(false)
  }

  const toggleFollowCoach = async (coachId: number) => {
    const { data } = await api.post(`/community/follow/${coachId}`)
    setCoaches(prev => prev.map(c => c.id === coachId ? { ...c, is_following: data.following } : c))
  }

  const handleChatRequest = async (userId: number) => {
    try {
      await api.post('/chat/requests', { to_user_id: userId })
      toast.success('Richiesta di chat inviata!')
    } catch {
      toast.error('Richiesta gia inviata o chat attiva')
    }
  }

  const deletePost = async (postId: number) => {
    await api.delete(`/community/posts/${postId}`)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  // Profile view
  if (profileUserId) {
    return (
      <div className="max-w-2xl mx-auto">
        <CoachProfileView
          userId={profileUserId}
          onBack={() => setProfileUserId(null)}
          onChatRequest={handleChatRequest}
        />
      </div>
    )
  }

  const tabs: { key: Tab; icon: typeof Globe; label: string }[] = [
    { key: 'feed', icon: Globe, label: 'Feed' },
    { key: 'discover', icon: Compass, label: 'Scopri' },
    { key: 'saved', icon: Bookmark, label: 'Salvati' },
    { key: 'coaches', icon: Users, label: 'Coach' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe size={24} /> CoachHub
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">La community degli allenatori</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Pubblica
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
              tab === key ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400')}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Create post */}
      {showCreate && (
        <CreatePost
          onCreated={(post) => { setPosts(prev => [post, ...prev]); setShowCreate(false) }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Coaches search */}
      {tab === 'coaches' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-10 text-sm" placeholder="Cerca coach..."
                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); searchCoaches(e.target.value) }} />
            </div>
          </div>

          {!searchQuery && coaches.length === 0 && !searchingCoaches && (
            <div className="text-center py-4">
              <button onClick={() => searchCoaches('')} className="btn-secondary text-sm">Mostra tutti i coach</button>
            </div>
          )}

          <div className="space-y-2">
            {coaches.map(coach => (
              <div key={coach.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                <button onClick={() => setProfileUserId(coach.id)}
                  className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold">
                  {coach.name.charAt(0)}
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={() => setProfileUserId(coach.id)} className="font-semibold text-sm hover:underline">{coach.name}</button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sportLabels[coach.sport || ''] || coach.sport}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleChatRequest(coach.id)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs">
                    Messaggio
                  </button>
                  <button onClick={() => toggleFollowCoach(coach.id)}
                    className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      coach.is_following ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-brand-500 text-white')}>
                    <UserPlus size={14} /> {coach.is_following ? 'Seguendo' : 'Segui'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts feed */}
      {tab !== 'coaches' && (
        <>
          {loading ? <PageSkeleton /> : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post}
                  onLikeToggle={(id, liked, count) => setPosts(prev => prev.map(p => p.id === id ? { ...p, liked, likes_count: count } : p))}
                  onSaveToggle={(id, saved, count) => setPosts(prev => prev.map(p => p.id === id ? { ...p, saved, saves_count: count } : p))}
                  onDelete={deletePost}
                  onProfileClick={(userId) => setProfileUserId(userId)} />
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <EmptyState
              icon={<Globe size={36} className="text-gray-400" />}
              title={tab === 'feed' ? 'Feed vuoto' : tab === 'saved' ? 'Nessun post salvato' : 'Nessun post'}
              description={tab === 'feed' ? 'Segui altri coach o pubblica il tuo primo post!' : tab === 'saved' ? 'Salva i post che ti interessano con il bookmark' : 'Scopri cosa condividono gli altri coach'}
              action={tab === 'feed' ? <button onClick={() => setTab('discover')} className="btn-primary text-sm"><Compass size={16} className="inline mr-1" /> Scopri Coach</button> : undefined}
            />
          )}
        </>
      )}
    </div>
  )
}
