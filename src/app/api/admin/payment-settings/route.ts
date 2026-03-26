import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 取得所有銀行帳戶
export async function GET() {
  const accounts = await prisma.bankAccount.findMany({
    orderBy: { displayOrder: 'asc' },
  })
  return NextResponse.json(accounts)
}

// POST: 新增銀行帳戶
export async function POST(request: Request) {
  try {
    const { bankName, bankCode, bankAccount, accountName } = await request.json()

    if (!bankName || !bankCode || !bankAccount || !accountName) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 })
    }

    // 找出目前最大的 displayOrder
    const maxOrder = await prisma.bankAccount.aggregate({
      _max: { displayOrder: true },
    })
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1

    const account = await prisma.bankAccount.create({
      data: {
        bankName: bankName.trim(),
        bankCode: bankCode.trim(),
        bankAccount: bankAccount.trim(),
        accountName: accountName.trim(),
        displayOrder: nextOrder,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('BankAccount create error:', error)
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}

// PATCH: 更新銀行帳戶（可更新欄位 + 調整順序）
export async function PATCH(request: Request) {
  try {
    const { id, bankName, bankCode, bankAccount, accountName, displayOrder } = await request.json()

    if (!id) {
      return NextResponse.json({ error: '缺少帳戶ID' }, { status: 400 })
    }

    const updateData: any = {}
    if (bankName !== undefined) updateData.bankName = bankName.trim()
    if (bankCode !== undefined) updateData.bankCode = bankCode.trim()
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount.trim()
    if (accountName !== undefined) updateData.accountName = accountName.trim()
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder

    const updated = await prisma.bankAccount.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('BankAccount update error:', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}

// DELETE: 刪除銀行帳戶
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少帳戶ID' }, { status: 400 })
    }

    await prisma.bankAccount.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('BankAccount delete error:', error)
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}
