import { Suspense } from 'react'
import LoginClient from './login-client'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams
  return (
    <Suspense fallback={<div className="min-h-[200px] animate-pulse rounded-xl bg-slate-200" />}>
      <LoginClient message={params?.message ?? null} />
    </Suspense>
  )
}
