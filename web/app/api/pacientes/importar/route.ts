import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface ContatoImportado {
  nome: string
  ddi: string
  ddd: string
  numero: string
  email?: string
  data_nascimento?: string
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, role')
    .eq('id', user.id)
    .single()

  if (terapeuta?.role === 'secretaria') {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const body = await request.json() as { contatos: ContatoImportado[] }
  const contatos = body.contatos ?? []

  if (!contatos.length) {
    return NextResponse.json({ error: 'Nenhum contato encontrado no arquivo.' }, { status: 400 })
  }

  const service = createServiceClient()
  let importados = 0
  let ignorados = 0
  const erros: string[] = []

  for (const c of contatos) {
    if (!c.nome?.trim()) { erros.push(`Linha sem nome ignorada`); ignorados++; continue }

    // Monta o número de WhatsApp: DDI + DDD + número (só dígitos)
    const ddi    = (c.ddi ?? '55').replace(/\D/g, '') || '55'
    const ddd    = (c.ddd ?? '').replace(/\D/g, '')
    const numero = (c.numero ?? '').replace(/\D/g, '')

    if (!numero) { erros.push(`${c.nome}: número inválido`); ignorados++; continue }

    const whatsapp = `${ddi}${ddd}${numero}`

    // Verifica duplicata por whatsapp no mesmo terapeuta
    const { data: existente } = await service
      .from('pacientes')
      .select('id')
      .eq('terapeuta_id', user.id)
      .eq('whatsapp', whatsapp)
      .maybeSingle()

    if (existente) { ignorados++; continue }

    const { error } = await service.from('pacientes').insert({
      terapeuta_id:   user.id,
      clinica_id:     terapeuta?.clinica_id ?? null,
      profissional_id: user.id,
      nome:           c.nome.trim(),
      whatsapp,
      email:          c.email?.trim() || null,
      data_nascimento: c.data_nascimento || null,
      ativo:          true,
      consentimento_lgpd: false,
    })

    if (error) {
      erros.push(`${c.nome}: ${error.message}`)
      ignorados++
    } else {
      importados++
    }
  }

  return NextResponse.json({ importados, ignorados, erros: erros.slice(0, 10) })
}
