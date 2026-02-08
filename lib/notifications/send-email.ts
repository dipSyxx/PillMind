/**
 * Email notifications via Maileroo templates (optional).
 * Set MAILEROO_API_KEY, MAILEROO_FROM_ADDRESS, MAILEROO_FROM_NAME,
 * MAILEROO_TEMPLATE_EMAIL_NOTIFICATION_REMINDER_ID (reminder),
 * MAILEROO_TEMPLATE_EMAIL_LOW_STOCK_ID (low-stock).
 * Optional: NEXT_PUBLIC_APP_URL or APP_URL for "Open PillMind" button (default: https://v0-pill-mind-landing-page.vercel.app/home).
 * Same pattern as app/api/verify/send (template API).
 */

const apiKey = process.env.MAILEROO_API_KEY
const fromAddress = process.env.MAILEROO_FROM_ADDRESS
const fromName = process.env.MAILEROO_FROM_NAME ?? 'PillMind'
const templateNotificationId = process.env.MAILEROO_TEMPLATE_EMAIL_NOTIFICATION_REMINDER_ID
  ? Number(process.env.MAILEROO_TEMPLATE_EMAIL_NOTIFICATION_REMINDER_ID)
  : null
const templateLowStockId = process.env.MAILEROO_TEMPLATE_EMAIL_LOW_STOCK_ID
  ? Number(process.env.MAILEROO_TEMPLATE_EMAIL_LOW_STOCK_ID)
  : null

/** App URL for "Open PillMind" button in email templates (e.g. https://v0-pill-mind-landing-page.vercel.app/home) */
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  'https://v0-pill-mind-landing-page.vercel.app/home'

const MAILEROO_TEMPLATE_URL = 'https://smtp.maileroo.com/api/v2/emails/template'

export interface ReminderEmailParams {
  medicationName: string
  scheduledFor: Date
  timezone?: string
  name?: string
}

export interface LowStockItem {
  name: string
  currentQty: number
  lowThreshold: number
  unit?: string
}

export interface LowStockEmailParams {
  medications: LowStockItem[]
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey && fromAddress)
}

async function sendMailerooTemplate(payload: {
  to: string
  subject: string
  template_id: number
  template_data: Record<string, unknown>
}): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey || !fromAddress) {
    return { ok: false, error: 'Email not configured' }
  }

  try {
    const body = {
      from: {
        address: fromAddress,
        display_name: fromName,
      },
      to: [{ address: payload.to }],
      subject: payload.subject,
      template_id: payload.template_id,
      template_data: payload.template_data,
      tracking: true,
      tags: { type: 'notification' },
    }

    const res = await fetch(MAILEROO_TEMPLATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.success === false) {
      const message = data?.message ?? data?.error ?? `HTTP ${res.status}`
      return { ok: false, error: message }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: message }
  }
}

/**
 * Send a medication reminder email via Maileroo template (MAILEROO_TEMPLATE_EMAIL_NOTIFICATION_ID).
 */
export async function sendReminderEmail(
  to: string,
  params: ReminderEmailParams,
): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey || !fromAddress) return { ok: false, error: 'Email not configured' }
  if (!templateNotificationId) return { ok: false, error: 'MAILEROO_TEMPLATE_EMAIL_NOTIFICATION_ID not set' }

  const scheduledTime = params.scheduledFor.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: params.timezone ?? 'UTC',
  })
  const subject = `Reminder: ${params.medicationName}`
  const year = new Date().getFullYear()

  return sendMailerooTemplate({
    to,
    subject,
    template_id: templateNotificationId,
    template_data: {
      name: params.name ?? 'there',
      medicationName: params.medicationName,
      scheduledTime,
      year,
      appUrl,
    },
  })
}

/**
 * Send a low-stock alert email via Maileroo template (MAILEROO_TEMPLATE_EMAIL_LOW_STOCK_ID).
 */
export async function sendLowStockEmail(
  to: string,
  params: LowStockEmailParams,
): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey || !fromAddress) return { ok: false, error: 'Email not configured' }
  if (!templateLowStockId) return { ok: false, error: 'MAILEROO_TEMPLATE_EMAIL_LOW_STOCK_ID not set' }

  const subject = `Low stock: ${params.medications.length} medication(s)`
  const year = new Date().getFullYear()
  const medications = params.medications.map((m) => ({
    name: m.name,
    currentQty: m.currentQty,
    lowThreshold: m.lowThreshold,
    unit: m.unit ?? '',
  }))

  return sendMailerooTemplate({
    to,
    subject,
    template_id: templateLowStockId,
    template_data: {
      year,
      medicationsCount: params.medications.length,
      medications,
      appUrl,
    },
  })
}
