import { useState, useRef } from 'react'
import api from '@/api/client'
import { useToastStore } from '@/store/toast'
import { Camera, Upload, X, User } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  athleteId: number
  currentPhotoUrl: string | null
  onPhotoUpdated: (url: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function PhotoUpload({ athleteId, currentPhotoUrl, onPhotoUpdated, size = 'md' }: Props) {
  const toast = useToastStore()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Formato non supportato. Usa JPG, PNG o WebP.')
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File troppo grande. Massimo 5 MB.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const { data } = await api.post(`/athletes/${athleteId}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onPhotoUpdated(data.photo_url)
      toast.success('Foto aggiornata!')
    } catch {
      toast.error('Errore nel caricamento della foto')
      setPreview(null)
    }
    setUploading(false)
  }

  const photoSrc = preview || (currentPhotoUrl ? `${api.defaults.baseURL?.replace('/api', '')}${currentPhotoUrl}` : null)

  return (
    <div className="relative group inline-block">
      <div className={clsx(
        'rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
        sizeClasses[size],
      )}>
        {photoSrc ? (
          <img src={photoSrc} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User size={size === 'lg' ? 40 : size === 'md' ? 28 : 18} className="text-gray-400 dark:text-gray-600" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          </div>
        )}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'absolute bottom-0 right-0 bg-brand-600 text-white rounded-full p-1.5 shadow-lg',
          'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-700',
          size === 'sm' && 'p-1',
        )}
      >
        <Camera size={size === 'sm' ? 10 : 14} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
