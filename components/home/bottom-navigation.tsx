'use client'

import React from 'react'
import { Home, ListChecks, Pill, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'home' | 'meds' | 'logs' | 'profile'

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-[#E2E8F0]">
      <div className="grid grid-cols-4 px-4 py-2 text-xs">
        <NavItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
        <NavItem icon={Pill} label="Meds" active={activeTab === 'meds'} onClick={() => onTabChange('meds')} />
        <NavItem icon={ListChecks} label="Logs" active={activeTab === 'logs'} onClick={() => onTabChange('logs')} />
        <NavItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />
      </div>
    </nav>
  )
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<any>
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center py-1 rounded-xl transition',
        active ? 'text-[#0EA8BC]' : 'text-[#64748B] hover:text-[#0F172A]',
      )}
    >
      <Icon className="w-5 h-5 mb-0.5" />
      {label}
    </button>
  )
}
