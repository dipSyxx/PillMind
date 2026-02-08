import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/prisma-client'
import { getUserIdFromSession } from '@/lib/session'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 },
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}-${timestamp}.${extension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    // Generate public URL
    const imageUrl = `/uploads/avatars/${filename}`

    // Update user's image field
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        age: true,
        weight: true,
        height: true,
        sex: true,
        goals: true,
        medicalConditions: true,
      },
    })

    return NextResponse.json({
      ...updatedUser,
      weight: updatedUser.weight ? Number(updatedUser.weight) : null,
      height: updatedUser.height ? Number(updatedUser.height) : null,
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
