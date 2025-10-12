'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { DoseLog } from '@/types/medication'

interface SnoozeDialogProps {
  snoozeFor: DoseLog | null
  onClose: () => void
  onSnooze: (doseLogId: string, minutes: number) => void
}

export function SnoozeDialog({ snoozeFor, onClose, onSnooze }: SnoozeDialogProps) {
  if (!snoozeFor) return null

  return (
    <Dialog open={!!snoozeFor} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Snooze dose</DialogTitle>
          <DialogDescription>Remind me again in…</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 60].map((m) => (
            <Button key={m} variant="pillmindWhite" onClick={() => onSnooze(snoozeFor.id, m)} className="rounded-xl">
              {m}m
            </Button>
          ))}
        </div>
        <DialogClose asChild>
          <Button variant="pillmind" className="w-full mt-3 rounded-xl">
            Done
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
