'use client'

import { useEnsureSettings } from '@/hooks/useEnsureSettings'
import { useUserStoreInit } from '@/hooks/useUserStore'

export default function EnsureSettings() {
  useEnsureSettings()
  useUserStoreInit()
  return null
}
