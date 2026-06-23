'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface Contato {
  nome: string
  ddi: string
  ddd: string
  numero: string
  email?: string
  data_nascimento?: string
}

type Estado = 'idle' | 'preview' | 'importando' | 'resultado'

interface Resultado {
  importados: number
  ignorados: number
  erros: string[]
}

export default function ImportarContatosButton() {
  const [aberto, setAberto] = useState(false)
  const [estado, setEstado] = useState<Estado>('idle')
  const [contatos, setContatos] = useState<Contato[]>([])
  const [erroArquivo, setErroArquivo] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Normaliza os headers do arquivo para os campos esperados
  function normalizarHeader(h: string): keyof Contato | null {
    const map: Record<string, keyof Contato> = {
      'nome': 'nome', 'name': 'nome',
      'ddi': 'ddi',
      'ddd': 'ddd',
      'numero': 'numero', 'número': 'numero', 'telefone': 'numero', 'celular': 'numero', 'phone': 'numero',
      'email': 'email', 'e-mail': 'email',
      'data_nascimento': 'data_nascimento', 'nascimento': 'data_nascimento',
      'data de nascimento': 'data_nascimento', 'aniversario': 'data_nascimento', 'aniversário': 'data_nascimento',
    }
    return map[h.toLowerCase().trim()] ?? null
  }

  function processarLinhas(linhas: Record<string, string>[]) {
    const resultado: Contato[] = []
    for (const linha of linhas) {
      const c: Partial<Contato> = {}
      for (const [k, v] of Object.entries(linha)) {
        const campo = normalizarHeader(k)
        if (campo && v) c[campo] = String(v).trim()
      }
      if (c.nome) resultado.push({ ddi: '55', ddd: '', numero: '', ...c } as Contato)
    }
    return resultado
  }

  function handleArquivo(file: File) {
    setErroArquivo('')
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => {
          const lista = processarLinhas(data as Record<string, string>[])
          if (!lista.length) { setErroArquivo('Nenhum contato válido encontrado no arquivo.'); return }
          setContatos(lista)
          setEstado('preview')
        },
        error: () => setErroArquivo('Erro ao ler o arquivo CSV.'),
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target!.result, { type: 'array', cellDates: true })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
          const lista = processarLinhas(data)
          if (!lista.length) { setErroArquivo('Nenhum contato válido encontrado no arquivo.'); return }
          setContatos(lista)
          setEstado('preview')
        } catch {
          setErroArquivo('Erro ao ler o arquivo Excel.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setErroArquivo('Formato não suportado. Use .csv ou .xlsx')
    }
  }

  async function handleImportar() {
    setEstado('importando')
    try {
      const res = await fetch('/api/pacientes/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contatos }),
      })
      const data = await res.json()
      setResultado(data)
      setEstado('resultado')
    } catch {
      setErroArquivo('Erro de conexão. Tente novamente.')
      setEstado('preview')
    }
  }

  function fechar() {
    setAberto(false)
    setEstado('idle')
    setContatos([])
    setErroArquivo('')
    setResultado(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Importar contatos
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Importar contatos</h2>
              <button onClick={fechar} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* === IDLE: selecionar arquivo === */}
              {(estado === 'idle') && (
                <div className="space-y-4">
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors"
                  >
                    <p className="text-3xl mb-2">📁</p>
                    <p className="text-sm font-medium text-gray-700">Clique para selecionar o arquivo</p>
                    <p className="text-xs text-gray-400 mt-1">Aceita .csv ou .xlsx</p>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleArquivo(e.target.files[0])}
                    />
                  </div>

                  {erroArquivo && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{erroArquivo}</p>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                    <p className="font-medium text-gray-700 mb-2">Formato esperado das colunas:</p>
                    <p>• <strong>nome</strong> — Nome completo do paciente</p>
                    <p>• <strong>ddi</strong> — Código do país (ex: 55 para Brasil)</p>
                    <p>• <strong>ddd</strong> — Código de área (ex: 11)</p>
                    <p>• <strong>numero</strong> — Número sem DDD (ex: 999999999)</p>
                    <p>• <strong>email</strong> — E-mail (opcional)</p>
                    <p>• <strong>data_nascimento</strong> — Data de nascimento (opcional)</p>
                  </div>
                </div>
              )}

              {/* === PREVIEW === */}
              {estado === 'preview' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>{contatos.length}</strong> contatos encontrados. Revise antes de importar:
                  </p>
                  <div className="border border-gray-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Nome</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">WhatsApp</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contatos.map((c, i) => (
                          <tr key={i} className="border-t border-gray-50">
                            <td className="px-3 py-2 text-gray-800">{c.nome}</td>
                            <td className="px-3 py-2 text-gray-500">{c.ddi}{c.ddd}{c.numero || <span className="text-red-400">sem número</span>}</td>
                            <td className="px-3 py-2 text-gray-400 truncate max-w-[120px]">{c.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === IMPORTANDO === */}
              {estado === 'importando' && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Importando contatos…</p>
                </div>
              )}

              {/* === RESULTADO === */}
              {estado === 'resultado' && resultado && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-2xl mb-1">✅</p>
                    <p className="text-sm font-semibold text-green-800">{resultado.importados} contatos importados</p>
                    {resultado.ignorados > 0 && (
                      <p className="text-xs text-green-600 mt-1">{resultado.ignorados} ignorados (duplicatas ou sem número)</p>
                    )}
                  </div>
                  {resultado.erros.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-medium text-red-700">Erros:</p>
                      {resultado.erros.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3 justify-end">
              {estado === 'preview' && (
                <>
                  <button onClick={() => setEstado('idle')} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                    Voltar
                  </button>
                  <button
                    onClick={handleImportar}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
                  >
                    Importar {contatos.length} contatos
                  </button>
                </>
              )}
              {(estado === 'idle' || estado === 'resultado') && (
                <button onClick={estado === 'resultado' ? () => { fechar(); window.location.reload() } : fechar}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-xl transition-colors">
                  {estado === 'resultado' ? 'Concluir' : 'Cancelar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
