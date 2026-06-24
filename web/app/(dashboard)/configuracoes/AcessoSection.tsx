'use client'

import { useState, useTransition } from 'react'
import { salvarAcessoAction } from '@/app/actions/configuracoes'

export default function AcessoSection({
  equipeAcessaProntuario,
}: {
  equipeAcessaProntuario: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [valor, setValor] = useState(equipeAcessaProntuario)

  function handleAction(formData: FormData) {
    setSuccess(false)
    startTransition(async () => {
      await salvarAcessoAction(formData)
      setSuccess(true)
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white">Controle de acesso</h2>
        <p className="text-xs text-gray-400 mt-0.5">Defina o que cada membro da equipe pode visualizar</p>
      </div>

      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Salvo com sucesso.</p>
      )}

      <form action={handleAction} className="space-y-4">
        {/* Prontuário */}
        <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">🔒 Acesso ao prontuário clínico</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Quando desativado, apenas <strong>Admin</strong> e o próprio <strong>Profissional responsável</strong> acessam o prontuário.
              Secretária nunca acessa.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              name="equipe_acessa_prontuario"
              checked={valor}
              onChange={e => setValor(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
          <p className="font-medium">Resumo de permissões:</p>
          <p>• <strong>Admin</strong> — acesso total (pacientes, prontuário, agenda, equipe, financeiro)</p>
          <p>• <strong>Profissional</strong> — seus pacientes + prontuários {valor ? '(e de todos, pois está ativado acima)' : '(somente os seus)'}</p>
          <p>• <strong>Secretária</strong> — apenas agenda e dados de contato dos pacientes. Nunca acessa prontuário.</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          {isPending ? 'Salvando…' : 'Salvar configurações de acesso'}
        </button>
      </form>
    </div>
  )
}
