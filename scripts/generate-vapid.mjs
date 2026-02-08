/**
 * Generate VAPID keys for Web Push.
 * Run: node scripts/generate-vapid.mjs
 * Add the output to your .env as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.
 */
import webPush from 'web-push'

const { publicKey, privateKey } = webPush.generateVAPIDKeys()
console.log('Add these to your .env:\n')
console.log('VAPID_PUBLIC_KEY=' + publicKey)
console.log('VAPID_PRIVATE_KEY=' + privateKey)
