import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { changePasswordSchema } from "@/lib/validation"
import bcrypt from "bcryptjs"
import prisma from "@/prisma/prisma-client"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json()
  const parsed = changePasswordSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
  if (!user?.passwordHash) return NextResponse.json({ error: "Password auth not enabled" }, { status: 400 })

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) return NextResponse.json({ error: "Current password is wrong" }, { status: 400 })

  const newHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })

  return NextResponse.json({ ok: true })
}
