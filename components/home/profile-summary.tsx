'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserProfile } from '@/types/user-store'
import { format } from 'date-fns'
import { Calendar, Mail } from 'lucide-react'

interface ProfileSummaryProps {
  profile: UserProfile | null
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  if (!profile) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-center">
        <p className="text-sm text-[#64748B]">Loading profile...</p>
      </div>
    )
  }

  const initials =
    profile.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={profile.image || undefined} alt={profile.name || 'User'} />
          <AvatarFallback className="bg-[#0EA8BC]/10 text-[#0EA8BC] text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[#0F172A] truncate">{profile.name || 'User'}</h3>
            {profile.emailVerified && (
              <Badge variant="success" className="text-xs">
                Verified
              </Badge>
            )}
          </div>

          <div className="space-y-1 text-sm text-[#64748B]">
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span className="truncate">{profile.email}</span>
            </div>
            {profile.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>Joined {format(profile.createdAt, 'MMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
