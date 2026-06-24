export const metadata = {
  title: 'Política de Privacidade — Agenda Online AI',
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Política de Privacidade</h1>
          <p className="text-sm text-gray-400">Última atualização: maio de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Quem somos</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            O Agenda Online AI é uma plataforma SaaS voltada para psicólogos e terapeutas, que facilita o gerenciamento de prontuários, agendamentos, comunicação com pacientes e avaliações pós-sessão. O responsável pelo tratamento dos dados é o operador da plataforma, acessível em <strong>https://agendaonlineai.com.br</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Dados que coletamos</h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-300 leading-relaxed">
            <p><strong>Dados do terapeuta (usuário da plataforma):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Nome, e-mail e foto de perfil (fornecidos via login Google ou cadastro manual)</li>
              <li>CRP, biografia profissional e slug de URL pública</li>
              <li>Número de WhatsApp para comunicação com pacientes</li>
              <li>Tokens de acesso ao Google Calendar (para criação de eventos de sessão)</li>
              <li>ID de localização do Google Meus Negócios (para geração de links de avaliação)</li>
            </ul>
            <p className="mt-3"><strong>Dados dos pacientes (inseridos pelo terapeuta):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Nome, e-mail, WhatsApp e data de nascimento</li>
              <li>Queixa principal, histórico médico e medicamentos em uso</li>
              <li>Contato de emergência</li>
              <li>Gravações de áudio de sessões (processadas e imediatamente descartadas após transcrição)</li>
              <li>Transcrições e resumos gerados por inteligência artificial</li>
              <li>Avaliações pós-sessão (nota e comentário)</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Como usamos os dados do Google</h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-300 leading-relaxed">
            <p><strong>Google Calendar:</strong> utilizamos o token de acesso fornecido pelo terapeuta exclusivamente para criar, atualizar e remover eventos de sessão no calendário do próprio terapeuta. Não lemos, modificamos nem acessamos outros eventos ou dados do calendário.</p>
            <p><strong>Google Meus Negócios:</strong> utilizamos a API do Google Business Profile exclusivamente para identificar a página do terapeuta e gerar links de avaliação no Google. Não publicamos, editamos nem acessamos outros dados da página do negócio.</p>
            <p>O uso dos dados obtidos via APIs do Google segue a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Política de Dados de Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Compartilhamento de dados</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Não vendemos dados a terceiros. Compartilhamos dados apenas com os serviços necessários para o funcionamento da plataforma:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-2">
            <li><strong>Supabase</strong> — banco de dados e autenticação (servidores na UE/EUA)</li>
            <li><strong>OpenAI Whisper</strong> — transcrição de áudio (áudio descartado após processamento)</li>
            <li><strong>Anthropic Claude</strong> — geração de resumos e triagens</li>
            <li><strong>Stripe</strong> — processamento de pagamentos</li>
            <li><strong>Google APIs</strong> — Calendar e Business Profile</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">5. Segurança e retenção</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Todos os dados são armazenados com criptografia em repouso e em trânsito. Tokens do Google são armazenados de forma segura e utilizados exclusivamente nos contextos descritos nesta política. Dados de pacientes são acessíveis apenas ao terapeuta responsável, por meio de políticas de segurança em nível de linha (Row Level Security) no banco de dados.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Ao encerrar a conta, todos os dados do terapeuta e seus pacientes são removidos permanentemente mediante solicitação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">6. Direitos do usuário (LGPD)</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-2">
            <li>Acessar os dados que temos sobre você</li>
            <li>Corrigir dados incorretos ou desatualizados</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Portabilidade dos dados</li>
          </ul>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Para exercer esses direitos, entre em contato pelo e-mail: <a href="mailto:aleepedro@gmail.com" className="text-brand-600 hover:underline">aleepedro@gmail.com</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">7. Cookies</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Utilizamos cookies estritamente necessários para manter a sessão autenticada do usuário. Não utilizamos cookies de rastreamento ou publicidade.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">8. Contato</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Dúvidas sobre esta política? Entre em contato: <a href="mailto:aleepedro@gmail.com" className="text-brand-600 hover:underline">aleepedro@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
