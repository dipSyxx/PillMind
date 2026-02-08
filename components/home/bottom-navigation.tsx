'use client'

import { cn } from '@/lib/utils'
import { BarChart3, Home, ListChecks, Pill, User } from 'lucide-react'
import React from 'react'

type TabType = 'home' | 'meds' | 'logs' | 'analytics' | 'profile'

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-[#E2E8F0]">
      <div className="grid grid-cols-5 px-2 py-2 text-xs">
        <NavItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
        <NavItem icon={Pill} label="Meds" active={activeTab === 'meds'} onClick={() => onTabChange('meds')} />
        <NavItem icon={ListChecks} label="Logs" active={activeTab === 'logs'} onClick={() => onTabChange('logs')} />
        <NavItem
          icon={BarChart3}
          label="Analytics"
          active={activeTab === 'analytics'}
          onClick={() => onTabChange('analytics')}
        />
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
