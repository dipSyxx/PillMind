'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getClientTimePrefs } from '@/lib/time-prefs'

export function useEnsureSettings() {
  const { status } = useSession()
  useEffect(() => {
    if (status !== 'authenticated') return
    const { timeZone, uses12h } = getClientTimePrefs()
    fetch('/api/profile/settings/ensure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timezone: timeZone,
        timeFormat: uses12h ? 'H12' : 'H24',
      }),
    }).catch(() => {})
  }, [status])
}
