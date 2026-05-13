import cron from 'node-cron'
import { enviarLembretes } from './lembretes'
import { enviarTriagens } from './triagens'
import { enviarAvaliacoes } from './avaliacoes'

export function initSchedulers() {
  cron.schedule('0 10 * * *', enviarLembretes, { timezone: 'America/Sao_Paulo' })
  cron.schedule('5 10 * * *', enviarTriagens, { timezone: 'America/Sao_Paulo' })
  cron.schedule('*/15 * * * *', enviarAvaliacoes)
  console.log('Schedulers iniciados')
}
