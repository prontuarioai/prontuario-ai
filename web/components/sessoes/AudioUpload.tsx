'use client'

import { useRef, useState } from 'react'

interface Props {
  sessaoId: string
  onUploadSuccess: () => void
}

export default function AudioUpload({ sessaoId, onUploadSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const FORMATOS = ['mp3', 'mp4', 'm4a', 'wav', 'ogg', 'webm']

  function validateFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !FORMATOS.includes(ext)) {
      setError(`Formato não suportado. Use: ${FORMATOS.join(', ')}`)
      return false
    }
    if (file.size > 200 * 1024 * 1024) {
      setError('Arquivo muito grande (máx 200MB).')
      return false
    }
    return true
  }

  async function uploadFile(file: File) {
    if (!validateFile(file)) return
    setError('')
    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('audio', file)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
      })
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          await fetch(`/api/sessoes/${sessaoId}/transcrever`, { method: 'POST' })
          resolve()
        } else {
          reject(new Error('Upload falhou.'))
        }
      })
      xhr.addEventListener('error', () => reject(new Error('Erro de rede.')))
      xhr.open('POST', `/api/sessoes/${sessaoId}/upload-audio`)
      xhr.send(formData)
    }).then(() => {
      setUploading(false)
      onUploadSuccess()
    }).catch(err => {
      setError(err.message)
      setUploading(false)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {uploading ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{progress < 100 ? 'Enviando…' : 'Processando…'}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.mp4,.m4a,.wav,.ogg,.webm"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]) }}
          />
          <p className="text-3xl mb-2">🎙️</p>
          <p className="text-sm font-medium text-gray-700">
            Arraste o áudio ou clique para selecionar
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {FORMATOS.join(', ')} · máx 200MB
          </p>
        </div>
      )}
    </div>
  )
}
