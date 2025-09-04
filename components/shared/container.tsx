import type React from 'react'

export function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">{children}</div>
}
