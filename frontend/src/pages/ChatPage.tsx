import { useEffect, useState, useRef } from 'react'
import api from '@/api/client'
import type { ChatConversation, ChatMessage, ChatRequestType } from '@/types'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toast'
import EmptyState from '@/components/EmptyState/EmptyState'
import { PageSkeleton } from '@/components/Skeleton/Skeleton'
import {
  MessageCircle, Send, ArrowLeft, UserCircle, Check, X,
  Bell, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}g`
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const toast = useToastStore()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [requests, setRequests] = useState<{ received: ChatRequestType[]; sent: ChatRequestType[] }>({ received: [], sent: [] })
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState<{ userId: number; name: string } | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showRequests, setShowRequests] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadConversations()
    loadRequests()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const loadConversations = async () => {
    const { data } = await api.get('/chat/conversations')
    setConversations(data.conversations)
    setLoading(false)
  }

  const loadRequests = async () => {
    const { data } = await api.get('/chat/requests')
    setRequests(data)
  }

  const openChat = async (userId: number, name: string) => {
    setActiveChat({ userId, name })
    const { data } = await api.get(`/chat/messages/${userId}`)
    setMessages(data.messages)
    // Update unread
    setConversations(prev => prev.map(c => c.user_id === userId ? { ...c, unread_count: 0 } : c))
    // Start polling
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const { data } = await api.get(`/chat/messages/${userId}`)
      setMessages(data.messages)
    }, 5000)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return
    const { data } = await api.post(`/chat/messages/${activeChat.userId}`, { text: newMessage })
    setMessages(prev => [...prev, data.message])
    setNewMessage('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleAccept = async (requestId: number) => {
    await api.post(`/chat/requests/${requestId}/accept`)
    toast.success('Chat accettata!')
    loadRequests()
    loadConversations()
  }

  const handleReject = async (requestId: number) => {
    await api.post(`/chat/requests/${requestId}/reject`)
    loadRequests()
  }

  const closeChat = () => {
    setActiveChat(null)
    setMessages([])
    if (pollRef.current) clearInterval(pollRef.current)
    loadConversations()
  }

  // Active chat view
  if (activeChat) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-t-xl border border-gray-200 dark:border-gray-700 p-4">
          <button onClick={closeChat} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center font-bold text-brand-700 dark:text-brand-400">
            {activeChat.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm">{activeChat.name}</p>
            <p className="text-xs text-gray-400">Chat privata</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 border-x border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Inizia la conversazione!</p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={clsx('flex', msg.sender_id === user?.id ? 'justify-end' : 'justify-start')}>
              <div className={clsx('max-w-[75%] rounded-2xl px-4 py-2.5',
                msg.sender_id === user?.id
                  ? 'bg-brand-500 text-white rounded-br-md'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md')}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className={clsx('text-[10px] mt-1', msg.sender_id === user?.id ? 'text-brand-200' : 'text-gray-400')}>
                  {timeAgo(msg.created_at)}
                  {msg.sender_id === user?.id && msg.read && ' ✓✓'}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 bg-white dark:bg-gray-900 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 p-4">
          <input className="input-field text-sm flex-1" placeholder="Scrivi un messaggio..."
            value={newMessage} onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())} />
          <button onClick={sendMessage} disabled={!newMessage.trim()}
            className="btn-primary px-4 flex items-center gap-1.5">
            <Send size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <PageSkeleton />

  const totalPending = requests.received.length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle size={24} /> Chat
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Messaggi privati</p>
        </div>
        {totalPending > 0 && (
          <button onClick={() => setShowRequests(!showRequests)}
            className="relative btn-secondary flex items-center gap-2 text-sm">
            <Bell size={16} /> Richieste
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{totalPending}</span>
          </button>
        )}
      </div>

      {/* Pending requests */}
      {showRequests && requests.received.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Richieste ricevute</h3>
          {requests.received.map(req => (
            <div key={req.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center font-bold text-brand-700 dark:text-brand-400">
                {req.from_user_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{req.from_user_name}</p>
                <p className="text-xs text-gray-400">{req.from_user_sport} · {timeAgo(req.created_at)}</p>
              </div>
              <button onClick={() => handleAccept(req.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                <Check size={16} />
              </button>
              <button onClick={() => handleReject(req.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Conversations list */}
      <div className="space-y-2">
        {conversations.map(conv => (
          <button key={conv.user_id} onClick={() => openChat(conv.user_id, conv.name)}
            className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center font-bold text-brand-700 dark:text-brand-400 text-lg">
                {conv.avatar_url ? <img src={conv.avatar_url} className="w-12 h-12 rounded-full object-cover" /> : conv.name.charAt(0)}
              </div>
              {conv.unread_count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{conv.unread_count}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={clsx('font-semibold text-sm', conv.unread_count > 0 && 'text-gray-900 dark:text-white')}>
                  {conv.name}
                </p>
                {conv.last_message && (
                  <span className="text-xs text-gray-400">{timeAgo(conv.last_message.created_at)}</span>
                )}
              </div>
              {conv.last_message && (
                <p className={clsx('text-xs truncate mt-0.5', conv.unread_count > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400')}>
                  {conv.last_message.sender_id === user?.id ? 'Tu: ' : ''}{conv.last_message.text}
                </p>
              )}
            </div>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
          </button>
        ))}
      </div>

      {conversations.length === 0 && !showRequests && (
        <EmptyState
          icon={<MessageCircle size={36} className="text-gray-400" />}
          title="Nessuna conversazione"
          description="Cerca coach nella community e invia una richiesta di chat!"
        />
      )}
    </div>
  )
}
