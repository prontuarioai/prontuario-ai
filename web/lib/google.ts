import { google } from 'googleapis'

function buildOAuth2(refreshToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2.setCredentials({ refresh_token: refreshToken })
  return oauth2
}

export function buildOAuth2WithTokens(accessToken: string, refreshToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  return oauth2
}

export interface LocalNegocio {
  nome: string
  placeId: string | null
  reviewUrl: string | null
}

export async function listarLocaisNegocio(accessToken: string): Promise<LocalNegocio[]> {
  try {
    const accountsRes = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!accountsRes.ok) return []
    const { accounts } = await accountsRes.json()
    if (!accounts?.length) return []

    const result: LocalNegocio[] = []
    for (const account of accounts.slice(0, 5)) {
      const locRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,metadata`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!locRes.ok) continue
      const { locations } = await locRes.json()
      if (!locations?.length) continue

      for (const loc of locations) {
        const reviewUrl: string | null = loc.metadata?.newReviewUri ?? null
        const placeId = reviewUrl
          ? new URL(reviewUrl).searchParams.get('placeid')
          : null
        result.push({ nome: loc.title ?? account.accountName ?? 'Meu negócio', placeId, reviewUrl })
      }
    }
    return result
  } catch {
    return []
  }
}

export async function criarEventoCalendar({
  refreshToken,
  calendarId,
  titulo,
  inicio,
  fim,
  descricao,
  linkMeet,
}: {
  refreshToken: string
  calendarId: string
  titulo: string
  inicio: string
  fim: string
  descricao?: string
  linkMeet?: string | null
}): Promise<string | null> {
  try {
    const auth = buildOAuth2(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth })

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: titulo,
        description: descricao,
        start: { dateTime: inicio },
        end: { dateTime: fim },
        ...(linkMeet && {
          conferenceData: undefined,
          location: linkMeet,
        }),
      },
    })

    return data.id ?? null
  } catch {
    return null
  }
}

export async function deletarEventoCalendar({
  refreshToken,
  calendarId,
  eventId,
}: {
  refreshToken: string
  calendarId: string
  eventId: string
}): Promise<void> {
  try {
    const auth = buildOAuth2(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth })
    await calendar.events.delete({ calendarId, eventId })
  } catch {
    // ignora se evento já foi removido
  }
}
