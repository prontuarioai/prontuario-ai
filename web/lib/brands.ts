export type BrandContext = 'agenda_online_ai' | 'fluxus_sermonis' | 'open_publisher'

export interface Brand {
  name: string
  description: string
}

export const BRANDS: Record<BrandContext, Brand> = {
  agenda_online_ai: {
    name: 'Agenda Online AI',
    description: 'Gestão clínica inteligente',
  },
  fluxus_sermonis: {
    name: 'Fluxus Sermonis',
    description: 'WhatsApp e atendimento',
  },
  open_publisher: {
    name: 'Open Publisher',
    description: 'Publicação automática',
  },
}

export function getBrand(ctx: string | null | undefined): Brand {
  return BRANDS[(ctx ?? 'agenda_online_ai') as BrandContext] ?? BRANDS.agenda_online_ai
}

export function brandFromHost(host: string): BrandContext {
  if (host.includes('fluxus')) return 'fluxus_sermonis'
  if (host.includes('openpublisher') || host.includes('open-publisher')) return 'open_publisher'
  return 'agenda_online_ai'
}
