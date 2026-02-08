import { NextRequest } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Check if the request is authorized as a cron job (server-to-server).
 * When CRON_SECRET is set, accepts: Authorization: Bearer <CRON_SECRET>
 * Returns true if cron secret matches; false otherwise.
 */
export function isCronAuthorized(request: NextRequest): boolean {
  if (!CRON_SECRET) return false
  const auth = request.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  return token === CRON_SECRET
}

