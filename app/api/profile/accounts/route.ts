import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/prisma/prisma-client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ accounts: [] })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, passwordHash: true, accounts: { select: { provider: true } } },
  })
  return NextResponse.json({
    userId: user?.id ?? null,
    providers: (user?.accounts ?? []).map((a) => a.provider),
    hasPassword: !!user?.passwordHash,
  })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { provider } = await req.json()
  if (!provider) return NextResponse.json({ error: "Missing provider" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, passwordHash: true, accounts: { select: { provider: true } } },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const connected = user.accounts.map((a) => a.provider)
  const isOnlyThis = connected.length === 1 && connected[0] === provider
  const hasPassword = !!user.passwordHash

  // noone allows unlinking the last connected account if there is no password
  if (isOnlyThis && !hasPassword) {
    return NextResponse.json(
      { error: "You must set a password before unlinking your last connected account." },
      { status: 400 },
    )
  }

  await prisma.account.deleteMany({
    where: { userId: user.id, provider },
  })

  return NextResponse.json({ ok: true })
}
