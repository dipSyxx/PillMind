'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--pm-surface)',
          '--normal-text': 'var(--pm-text-primary)',
          '--normal-border': 'var(--pm-border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
