import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import Layout from '@/components/Layout/Layout'

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const AthletesPage = lazy(() => import('@/pages/AthletesPage'))
const TrainingsPage = lazy(() => import('@/pages/TrainingsPage'))
const MatchesPage = lazy(() => import('@/pages/MatchesPage'))
const InsightsPage = lazy(() => import('@/pages/InsightsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.onboarding_completed) return <Navigate to="/" replace />

  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return null
  if (user && user.onboarding_completed) return <Navigate to="/" replace />
  if (user && !user.onboarding_completed) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="athletes" element={<AthletesPage />} />
          <Route path="trainings" element={<TrainingsPage />} />
          <Route path="matches" element={<MatchesPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
