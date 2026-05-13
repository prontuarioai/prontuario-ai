import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function resumirSessao(transcricao: string): Promise<{
  principais_temas: string[]
  emocoes_detectadas: string[]
  pontos_trabalhados: string
  plano_proxima_sessao: string
  alertas: string[]
  valence: number
  arousal: number
}> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Você é um assistente clínico especializado em psicoterapia. Analise a transcrição abaixo e retorne um JSON válido com os campos solicitados.

TRANSCRIÇÃO:
${transcricao}

Retorne APENAS o JSON, sem markdown, sem explicações:
{
  "principais_temas": ["tema1", "tema2"],
  "emocoes_detectadas": ["emoção1", "emoção2"],
  "pontos_trabalhados": "descrição do que foi trabalhado",
  "plano_proxima_sessao": "sugestão para próxima sessão",
  "alertas": ["alerta se houver, ou array vazio"],
  "valence": 0.5,
  "arousal": 0.3
}

valence: de -1 (muito negativo) a 1 (muito positivo)
arousal: de -1 (muito baixo) a 1 (muito alto)`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
  return JSON.parse(text)
}

export async function analisarTriagem(dados: {
  humor_geral: number
  eventos_relevantes: string
  foco_sessao: string
}): Promise<{
  risco: 'baixo' | 'medio' | 'alto'
  observacoes: string
  emocoes: string[]
  valence: number
  arousal: number
}> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Analise a triagem pré-sessão de um paciente e retorne APENAS um JSON válido:

Humor geral (1-10): ${dados.humor_geral}
Eventos relevantes: ${dados.eventos_relevantes}
Foco desejado: ${dados.foco_sessao}

{
  "risco": "baixo|medio|alto",
  "observacoes": "análise clínica breve",
  "emocoes": ["emoção1", "emoção2"],
  "valence": 0.0,
  "arousal": 0.0
}

Critérios de risco alto: ideação suicida, crise aguda, violência. Médio: sofrimento intenso, recaída. Baixo: demais casos.`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
  return JSON.parse(text)
}
