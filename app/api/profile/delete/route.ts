import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/prisma/prisma-client"

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // завдяки onDelete: Cascade у Prisma, пов’язані записи (sessions/accounts) приберуться
  await prisma.user.delete({ where: { id: user.id } })
  return NextResponse.json({ ok: true })
}
