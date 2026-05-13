'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function salvarDisponibilidadesAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Remove todas as disponibilidades existentes do terapeuta
  await supabase
    .from('disponibilidades')
    .delete()
    .eq('terapeuta_id', user.id)

  // Reconstrói a partir do formData (formato: dia_{0-6}_{horaInicio}_{horaFim} = "on")
  const novas: { terapeuta_id: string; dia_semana: number; hora_inicio: string; hora_fim: string }[] = []

  for (const [key] of formData.entries()) {
    const match = key.match(/^dia_(\d)_(\d{2}:\d{2})_(\d{2}:\d{2})$/)
    if (match) {
      novas.push({
        terapeuta_id: user.id,
        dia_semana: parseInt(match[1]),
        hora_inicio: match[2],
        hora_fim: match[3],
      })
    }
  }

  if (novas.length > 0) {
    await supabase.from('disponibilidades').insert(novas)
  }

  revalidatePath('/agenda/disponibilidades')
  return { ok: true }
}

export async function adicionarDisponibilidadeAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dia_semana = parseInt(formData.get('dia_semana') as string)
  const hora_inicio = formData.get('hora_inicio') as string
  const hora_fim = formData.get('hora_fim') as string

  if (isNaN(dia_semana) || !hora_inicio || !hora_fim) return { error: 'Dados inválidos.' }
  if (hora_inicio >= hora_fim) return { error: 'Horário de início deve ser anterior ao fim.' }

  await supabase.from('disponibilidades').insert({
    terapeuta_id: user.id,
    dia_semana,
    hora_inicio,
    hora_fim,
  })

  revalidatePath('/agenda/disponibilidades')
  return { ok: true }
}

export async function removerDisponibilidadeAction(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('disponibilidades')
    .delete()
    .eq('id', id)
    .eq('terapeuta_id', user.id)

  revalidatePath('/agenda/disponibilidades')
}
