import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, Calendar, Trophy, BarChart3, Settings, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onComplete: () => void
}

const steps = [
  {
    key: 'welcome',
    icon: Sparkles,
    title: 'Benvenuto in Coach Partner!',
    desc: 'Ti guideremo attraverso le funzionalità principali dell\'app.',
    color: 'text-brand-600 dark:text-brand-400',
    bg: 'bg-brand-50 dark:bg-brand-900/30',
  },
  {
    key: 'home',
    icon: Home,
    title: 'Dashboard',
    desc: 'La tua panoramica con statistiche, trend e azioni rapide.',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  {
    key: 'athletes',
    icon: Users,
    title: 'Atleti',
    desc: 'Gestisci la tua rosa: profili, valutazioni, wellness e infortuni.',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
  },
  {
    key: 'trainings',
    icon: Calendar,
    title: 'Allenamenti',
    desc: 'Pianifica sessioni, usa il builder con drag & drop e il campo virtuale.',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
  },
  {
    key: 'matches',
    icon: Trophy,
    title: 'Gare',
    desc: 'Prepara le gare, analizza gli avversari e registra i risultati.',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
  },
  {
    key: 'insights',
    icon: BarChart3,
    title: 'Insights',
    desc: 'Visualizza statistiche avanzate e genera report con l\'AI.',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
  },
  {
    key: 'settings',
    icon: Settings,
    title: 'Impostazioni',
    desc: 'Personalizza il tuo profilo, gestisci stagioni e staff.',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800',
  },
  {
    key: 'done',
    icon: Sparkles,
    title: 'Tutto pronto!',
    desc: 'Inizia a gestire il tuo team come un professionista.',
    color: 'text-brand-600 dark:text-brand-400',
    bg: 'bg-brand-50 dark:bg-brand-900/30',
  },
]

export default function OnboardingTour({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const current = steps[step]
  const isLast = step === steps.length - 1

  const next = () => {
    if (isLast) {
      onComplete()
      return
    }
    setDirection(1)
    setStep(s => s + 1)
  }

  const prev = () => {
    if (step > 0) {
      setDirection(-1)
      setStep(s => s - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-brand-500"
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: direction * 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 50, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <div className={clsx('w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6', current.bg)}>
                <current.icon size={36} className={current.color} />
              </div>
              <h2 className="text-xl font-bold mb-2">{current.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{current.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {steps.map((_, i) => (
            <div key={i} className={clsx(
              'w-2 h-2 rounded-full transition-colors',
              i === step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
            )} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onComplete} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            Salta
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={prev} className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <ChevronLeft size={16} /> Indietro
              </button>
            )}
            <button onClick={next} className="flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors">
              {isLast ? 'Inizia!' : 'Avanti'} {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
