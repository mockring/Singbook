import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: {
      course: true,
      location: true,
      student: true
    }
  })

  if (!order) {
    return NextResponse.json({ error: '找不到訂單' }, { status: 404 })
  }

  return NextResponse.json(order)
}