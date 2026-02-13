import { useEffect, useState } from 'react'
import api from '@/api/client'
import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, Target, FileText, Star, Lock } from 'lucide-react'
import clsx from 'clsx'

interface Badge {
  key: string
  title: string
  desc: string
  icon: string
  threshold: number
  current: number
  unlocked: boolean
  progress: number
}

interface AchievementsData {
  badges: Badge[]
  level: number
  xp: number
  next_level_xp: number
  total_badges: number
  unlocked_badges: number
}

const iconMap: Record<string, typeof Trophy> = {
  users: Users,
  calendar: Calendar,
  trophy: Trophy,
  target: Target,
  'file-text': FileText,
}

export default function CoachBadges() {
  const [data, setData] = useState<AchievementsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/achievements')
      .then(({ data }) => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
  }

  if (!data) return null

  const unlockedBadges = data.badges.filter(b => b.unlocked)
  const lockedBadges = data.badges.filter(b => !b.unlocked)

  return (
    <div className="space-y-6">
      {/* Coach level */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-50 to-green-50 dark:from-brand-900/30 dark:to-green-900/30 rounded-2xl px-6 py-4">
          <div className="w-14 h-14 rounded-full bg-brand-500 flex items-center justify-center">
            <Star size={24} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">Livello Coach</p>
            <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">{data.level}</p>
          </div>
        </div>
        <div className="mt-3 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{data.xp} XP</span>
            <span>{data.next_level_xp} XP</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (data.xp / data.next_level_xp) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{data.unlocked_badges}/{data.total_badges} badge sbloccati</p>
      </div>

      {/* Unlocked badges */}
      {unlockedBadges.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase font-medium mb-3">Sbloccati</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {unlockedBadges.map((badge, i) => {
              const Icon = iconMap[badge.icon] || Trophy
              return (
                <motion.div key={badge.key}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Icon size={20} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <p className="text-[10px] font-medium leading-tight">{badge.title}</p>
                  <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{badge.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {lockedBadges.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase font-medium mb-3">Da sbloccare</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {lockedBadges.map(badge => {
              const Icon = iconMap[badge.icon] || Trophy
              return (
                <div key={badge.key} className="flex flex-col items-center text-center opacity-50">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1.5 relative">
                    <Icon size={20} className="text-gray-400" />
                    <Lock size={10} className="absolute -bottom-0.5 -right-0.5 text-gray-400" />
                  </div>
                  <p className="text-[10px] font-medium leading-tight">{badge.title}</p>
                  <div className="w-full mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 rounded-full" style={{ width: `${badge.progress}%` }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">{badge.current}/{badge.threshold}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
