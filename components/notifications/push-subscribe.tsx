'use client'

import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export interface PushSubscribeProps {
  /** Whether PUSH is enabled in user's default notification channels */
  pushEnabled: boolean
  /** Optional class name for the container */
  className?: string
}

export function PushSubscribe({ pushEnabled, className }: PushSubscribeProps) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const checkSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/push/subscriptions')
      if (res.ok) {
        const data = await res.json()
        setSubscribed(Array.isArray(data.subscriptions) && data.subscriptions.length > 0)
      }
    } catch {
      setSubscribed(false)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setSupported(
      'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    )
  }, [])

  useEffect(() => {
    if (pushEnabled && supported) {
      void checkSubscriptions()
    } else {
      setChecking(false)
    }
  }, [pushEnabled, supported, checkSubscriptions])

  const registerSw = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await reg.update()
      return reg
    } catch (err) {
      console.error('Service worker registration failed:', err)
      toast.error('Could not register notifications')
      return null
    }
  }, [])

  const enablePush = useCallback(async () => {
    if (!supported || !pushEnabled) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Notifications were denied')
        setLoading(false)
        return
      }

      const reg = await registerSw()
      if (!reg) {
        setLoading(false)
        return
      }

      const keyRes = await fetch('/api/notifications/push/vapid-public')
      if (!keyRes.ok) {
        toast.error('Push is not configured')
        setLoading(false)
        return
      }
      const { publicKey } = await keyRes.json()
      const applicationServerKey = urlBase64ToUint8Array(publicKey)

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      })

      const subJson = subscription.toJSON()
      const body = {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth
        }
      }

      const postRes = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!postRes.ok) {
        const err = await postRes.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save push subscription')
        setLoading(false)
        return
      }

      setSubscribed(true)
      toast.success('Push notifications enabled')
    } catch (err) {
      console.error('Enable push failed:', err)
      toast.error('Could not enable push notifications')
    } finally {
      setLoading(false)
    }
  }, [supported, pushEnabled, registerSw])

  if (!pushEnabled || !supported) return null
  if (checking) {
    return (
      <div className={className}>
        <div className="inline-flex items-center gap-2 text-sm text-[#64748B]">
          <div className="w-4 h-4 border-2 border-[#0EA8BC]/30 border-t-[#0EA8BC] rounded-full animate-spin" />
          Checking push status…
        </div>
      </div>
    )
  }
  if (subscribed) {
    return (
      <div className={className}>
        <div className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg">
          <Bell className="w-4 h-4" />
          Push notifications are on for this device
        </div>
      </div>
    )
  }
  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={enablePush}
        disabled={loading}
        className="inline-flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Enabling…
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            Enable push notifications
          </>
        )}
      </Button>
    </div>
  )
}
