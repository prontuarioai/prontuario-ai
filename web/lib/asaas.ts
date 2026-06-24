// ─────────────────────────────────────────────────────────────
// Asaas API Client
// Documentação: https://docs.asaas.com
// ─────────────────────────────────────────────────────────────

const ASAAS_API_URL = process.env.ASAAS_API_URL ?? 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY ?? ''

async function asaasFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = await res.text().catch(() => 'erro desconhecido')
    throw new Error(`Asaas ${res.status}: ${err}`)
  }

  return res.json()
}

// ── Customers ────────────────────────────────────────────────

export async function criarCustomer(params: {
  nome: string
  email: string
  cpfCnpj?: string
  externalReference?: string
}) {
  return asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: params.nome,
      email: params.email,
      cpfCnpj: params.cpfCnpj,
      externalReference: params.externalReference,
    }),
  }) as Promise<{ id: string }>
}

// ── Subscriptions (plano da plataforma) ──────────────────────

export async function criarAssinatura(params: {
  customerId: string
  valor: number
  descricao: string
  terapeutaId: string
}) {
  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + 1)
  const dueDateStr = nextDueDate.toISOString().split('T')[0]

  const sub = await asaasFetch('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'UNDEFINED', // cliente escolhe: PIX, boleto ou cartão
      value: params.valor,
      nextDueDate: dueDateStr,
      cycle: 'MONTHLY',
      description: params.descricao,
      externalReference: params.terapeutaId,
    }),
  }) as { id: string; status: string; invoiceUrl?: string }

  // Asaas pode não retornar invoiceUrl na criação da assinatura.
  // Busca o primeiro pagamento gerado para obter o link de cobrança.
  if (!sub.invoiceUrl) {
    try {
      const payments = await asaasFetch(
        `/payments?subscription=${sub.id}&status=PENDING&limit=1`,
      ) as { data: Array<{ invoiceUrl?: string; bankSlipUrl?: string }> }
      const first = payments.data[0]
      sub.invoiceUrl = first?.invoiceUrl ?? first?.bankSlipUrl
    } catch {
      // ignora erro na busca do pagamento — fallback no checkout
    }
  }

  return sub
}

export async function cancelarAssinatura(subscriptionId: string) {
  return asaasFetch(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  })
}

export async function getPortalAssinatura(customerId: string) {
  // Retorna o link de pagamento da próxima fatura pendente
  const data = await asaasFetch(
    `/payments?customer=${customerId}&status=PENDING&limit=1`,
  ) as { data: Array<{ invoiceUrl: string }> }
  return data.data[0]?.invoiceUrl ?? null
}

// ── Payments (por consulta) ───────────────────────────────────

export async function criarPagamentoConsulta(params: {
  customerId: string
  valor: number
  sessaoId: string
  descricao: string
  dueDate?: string // ISO date YYYY-MM-DD, padrão = amanhã
}) {
  const dueDate = params.dueDate ?? new Date(Date.now() + 86_400_000).toISOString().split('T')[0]

  return asaasFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'UNDEFINED', // PIX, boleto ou cartão — paciente escolhe
      value: params.valor,
      dueDate,
      description: params.descricao,
      externalReference: params.sessaoId,
    }),
  }) as Promise<{ id: string; invoiceUrl: string; status: string }>
}

export async function getOuCriarCustomerPaciente(params: {
  nome: string
  email?: string | null
  whatsapp?: string | null
  pacienteId: string
}): Promise<string> {
  // Busca por referência externa (pacienteId)
  try {
    const res = await asaasFetch(
      `/customers?externalReference=${params.pacienteId}&limit=1`,
    ) as { data: Array<{ id: string }> }

    if (res.data.length > 0) return res.data[0].id
  } catch {}

  // Cria novo customer
  const customer = await criarCustomer({
    nome: params.nome,
    email: params.email ?? `paciente-${params.pacienteId}@agendaonlineai.com.br`,
    externalReference: params.pacienteId,
  })

  return customer.id
}

// ── Webhook helpers ───────────────────────────────────────────

export function verificarTokenWebhook(token: string) {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? ''
  return token === webhookToken
}
