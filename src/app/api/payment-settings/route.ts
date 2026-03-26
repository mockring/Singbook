import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // 取得所有銀行帳戶，按 displayOrder 排序
  const accounts = await prisma.bankAccount.findMany({
    orderBy: { displayOrder: 'asc' },
  })
  return NextResponse.json(accounts)
}
