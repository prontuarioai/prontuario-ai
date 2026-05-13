'use client'

import { useState } from 'react'
import AudioUpload from '@/components/sessoes/AudioUpload'
import TranscricaoPanel from '@/components/sessoes/TranscricaoPanel'

export default function AudioUploadSection({ sessaoId }: { sessaoId: string }) {
  const [uploaded, setUploaded] = useState(false)

  if (uploaded) {
    return (
      <TranscricaoPanel
        sessaoId={sessaoId}
        transcricaoInicial={{ status: 'processando', texto: null }}
        resumoInicial={null}
      />
    )
  }

  return <AudioUpload sessaoId={sessaoId} onUploadSuccess={() => setUploaded(true)} />
}
