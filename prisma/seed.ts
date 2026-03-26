import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('開始寫入初始資料...')

  // 1. 建立地點 (5筆)
  const locations = [
    {
      name: '小米個人工作室',
      address: '（待填寫）',
      price: 0,
      description: '個人工作室',
      isActive: true,
    },
    {
      name: '知熹多功能教室',
      address: '（待填寫）',
      price: 400,
      description: '多功能教室',
      isActive: true,
    },
    {
      name: '慕斯克多功能教室',
      address: '（待填寫）',
      price: 600,
      description: '多功能教室',
      isActive: true,
    },
    {
      name: '信義私人錄音室',
      address: '（待填寫）',
      price: 700,
      description: '私人錄音室',
      isActive: true,
    },
    {
      name: '歐邦寄錄工作室',
      address: '（待填寫）',
      price: 500,
      description: '錄音工作室',
      isActive: true,
    },
  ]

  for (const loc of locations) {
    const existing = await prisma.location.findFirst({ where: { name: loc.name } })
    if (!existing) {
      await prisma.location.create({ data: loc })
      console.log(`✓ 建立地點: ${loc.name} (NT$${loc.price}/堂)`)
    } else {
      console.log(`⏩ 地點已存在: ${loc.name}`)
    }
  }

  // 2. 建立老師帳號 (密碼: 123456)
  const teacherPassword = '123456' // 生產環境應該雜湊處理
  const teacher = await prisma.teacher.upsert({
    where: { email: 'teacher@singbook.com' },
    update: {},
    create: {
      name: 'STAGELESS 老師',
      email: 'teacher@singbook.com',
      password: teacherPassword,
      bio: '自學唱歌背景，專精流行歌曲演唱技巧',
    },
  })
  console.log(`✓ 建立老師帳號: ${teacher.email} (密碼: 123456)`)

  // 3. 建立範例課程 (3筆)
  const courses = [
    {
      name: '聲音開發',
      price: 900,
      sessions: 1,
      description: '開發你的聲音潛能，建立正確的發聲習慣',
      isActive: true,
    },
    {
      name: '5堂優惠',
      price: 4000,
      sessions: 5,
      description: '5堂課程優惠組合，快速提升歌唱技巧',
      isActive: true,
    },
    {
      name: '10堂優惠',
      price: 8100,
      sessions: 10,
      description: '10堂課程優惠，全面系統性學習',
      isActive: true,
    },
  ]

  for (const course of courses) {
    const existing = await prisma.course.findFirst({ where: { name: course.name } })
    if (!existing) {
      await prisma.course.create({ data: course })
      console.log(`✓ 建立課程: ${course.name} (NT$${course.price} / ${course.sessions}堂)`)
    } else {
      console.log(`⏩ 課程已存在: ${course.name}`)
    }
  }

  console.log('\n✅ 初始資料建立完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })