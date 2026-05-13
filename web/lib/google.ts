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
