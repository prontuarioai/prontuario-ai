import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Preços — Agenda Online AI' }

const features = [
  'Prontuário digital ilimitado',
  'Triagem pré-sessão via WhatsApp',
  'Transcrição de áudio com IA',
  'Resumo automático de sessões',
  'Avaliação pós-sessão',
  'Agenda integrada ao Google Calendar',
  'Agendamento público online',
  'Mapa emocional do paciente',
  'Dashboard com análises',
  'Conformidade com LGPD',
]

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-teal-700">Agenda Online AI</Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Simples e transparente</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Um preço base acessível mais um valor pequeno por paciente ativo. Pague só pelo que usar.
          </p>
        </div>

        {/* Card de preço */}
        <div className="max-w-sm mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div>
            <p className="text-sm font-medium text-teal-600 mb-1">Plano único</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">R$ 29</span>
              <span className="text-xl font-bold text-gray-900">,90</span>
              <span className="text-gray-400 text-sm">/mês</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">+ R$ 2,99 por paciente ativo/mês</p>
          </div>

          <div className="bg-teal-50 rounded-2xl p-4 space-y-1">
            <p className="text-sm font-semibold text-teal-900">Exemplo prático</p>
            <p className="text-sm text-teal-700">10 pacientes = R$ 29,90 + R$ 29,90 = <strong>R$ 59,80/mês</strong></p>
            <p className="text-sm text-teal-700">20 pacientes = R$ 29,90 + R$ 59,80 = <strong>R$ 89,70/mês</strong></p>
          </div>

          <ul className="space-y-2.5">
            {features.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                <svg className="w-4 h-4 text-teal-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/cadastro"
            className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Começar 14 dias grátis
          </Link>
          <p className="text-center text-xs text-gray-400">Sem cartão de crédito. Cancele quando quiser.</p>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Perguntas frequentes</h2>
          {[
            { q: 'O que é considerado um paciente ativo?', a: 'Paciente com pelo menos uma sessão agendada ou realizada no mês vigente.' },
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem multas ou fidelidade. Ao cancelar, você mantém acesso até o fim do período pago.' },
            { q: 'Meus dados ficam seguros?', a: 'Todos os dados são criptografados e armazenados no Brasil, em conformidade com a LGPD.' },
            { q: 'O período de teste é realmente grátis?', a: 'Sim. 14 dias com acesso completo, sem cadastrar cartão de crédito.' },
          ].map(item => (
            <div key={item.q} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-900 mb-2">{item.q}</p>
              <p className="text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>

        {/* CTA final */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Pronto para começar?</h2>
          <p className="text-gray-500">Junte-se a terapeutas que já usam o Agenda Online AI para cuidar melhor dos seus pacientes.</p>
          <Link href="/cadastro" className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
            Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  )
}
