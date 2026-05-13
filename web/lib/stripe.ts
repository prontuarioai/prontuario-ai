import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function syncPacientesStripe(subscriptionId: string, count: number) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items'],
  })

  const pacItem = subscription.items.data.find(
    item => item.price.id === process.env.STRIPE_PRICE_ID_PACIENTE
  )

  if (pacItem) {
    await stripe.subscriptionItems.update(pacItem.id, { quantity: count })
  }
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}
