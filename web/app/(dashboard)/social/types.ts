export type Rede = 'instagram' | 'facebook' | 'google_business' | 'youtube'

export interface Conta {
  provider: Rede
  nome: string
  fotoUrl: string | null
  conectada: boolean
}

export interface InboxItem {
  id: string
  rede: Rede
  tipo: 'comentario' | 'dm'
  autorNome: string
  texto: string
  criadoEm: string
  urlOriginal?: string
}

export interface PostRecente {
  id: string
  rede: Rede
  conteudo: string
  criadoEm: string
  status: 'publicado' | 'agendado' | 'erro'
}

export const REDES_INFO: Record<Rede, { label: string; cor: string }> = {
  instagram: { label: 'Instagram', cor: '#E1306C' },
  facebook: { label: 'Facebook', cor: '#1877F2' },
  google_business: { label: 'Google Business', cor: '#4285F4' },
  youtube: { label: 'YouTube', cor: '#FF0000' },
}
