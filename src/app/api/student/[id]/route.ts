import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const student = await prisma.student.findUnique({
    where: { id: parseInt(id) }
  })

  if (!student) {
    return NextResponse.json({ error: '找不到學生' }, { status: 404 })
  }

  return NextResponse.json(student)
}