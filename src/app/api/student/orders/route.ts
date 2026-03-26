import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json({ orders: [], student: null })
  }

  const student = await prisma.student.findUnique({
    where: { id: parseInt(studentId) }
  })

  if (!student) {
    return NextResponse.json({ orders: [], student: null })
  }

  const orders = await prisma.order.findMany({
    where: { studentId: parseInt(studentId) },
    include: {
      course: true,
      location: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ orders, student })
}