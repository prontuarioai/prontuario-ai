interface AuditLog {
  id: string
  action: string
  table_name: string
  created_at: string
  user_id: string
}

const actionLabel: Record<string, string> = {
  INSERT: 'Criou',
  UPDATE: 'Atualizou',
  DELETE: 'Removeu',
  SELECT: 'Consultou',
}

const tableLabel: Record<string, string> = {
  pacientes: 'paciente',
  sessoes: 'sessão',
  terapeutas: 'usuário',
  convites: 'convite',
  clinicas: 'clínica',
}

export default function AuditLogsSection({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Registro de atividades</h2>
        <p className="text-sm text-gray-400">Nenhuma atividade registrada ainda.</p>
      </section>
    )
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Registro de atividades</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Últimas ações realizadas na clínica</p>
      </div>
      <div className="divide-y divide-gray-50">
        {logs.map(log => (
          <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                log.action === 'DELETE' ? 'bg-red-50 text-red-600' :
                log.action === 'INSERT' ? 'bg-green-50 text-green-600' :
                log.action === 'UPDATE' ? 'bg-blue-50 text-blue-600' :
                'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {actionLabel[log.action] ?? log.action}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                {tableLabel[log.table_name] ?? log.table_name}
              </span>
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
