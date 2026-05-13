export async function sendWhatsApp(terapeutaId: string, to: string, text: string) {
  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return

  await fetch(`${apiUrl}/whatsapp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': apiSecret,
    },
    body: JSON.stringify({ terapeutaId, to, text }),
  }).catch(console.error)
}
