'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function enviarMensagemPacienteAction(pacienteId: string, texto: string) {
  if (!texto.trim()) return { error: 'Mensagem vazia.' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const [{ data: terapeuta }, { data: paciente }] = await Promise.all([
    supabase.from('terapeutas').select('clinica_id').eq('id', user.id).single(),
    supabase.from('pacientes').select('whatsapp').eq('id', pacienteId).single(),
  ])

  if (!paciente?.whatsapp) return { error: 'Paciente sem WhatsApp cadastrado.' }

  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return { error: 'Configuração ausente.' }

  const res = await fetch(`${apiUrl}/whatsapp/send-via-secretaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
    body: JSON.stringify({
      clinicaId: terapeuta?.clinica_id ?? null,
      fallbackTerapeutaId: user.id,
      to: paciente.whatsapp,
      text: texto,
    }),
  }).catch(() => null)

  if (!res?.ok) return { error: 'Falha ao enviar. WhatsApp conectado?' }

  await supabase.from('eventos_entre_sessoes').insert({
    terapeuta_id: user.id,
    paciente_id: pacienteId,
    clinica_id: terapeuta?.clinica_id ?? null,
    mensagem: texto,
    direcao: 'saida',
    categoria: 'cotidiano',
    intensidade_emocional: 1,
  })

  revalidatePath(`/pacientes/${pacienteId}`)
  return { ok: true }
}
