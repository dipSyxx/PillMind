import { Suspense } from 'react'
import LoginClient from './login-client'

export default function LoginPage({ searchParams }: { searchParams: { message?: string } }) {
  return (
    <Suspense fallback={<div className="min-h-[200px] animate-pulse rounded-xl bg-slate-200" />}>
      <LoginClient message={searchParams?.message ?? null} />
    </Suspense>
  )
}
