import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function reset() {
  const result = await prisma.stockEvent.updateMany({
    where: { tweetPosted: true },
    data: { tweetPosted: false }
  })
  console.log(`Reset ${result.count} stocks to tweetPosted=false`)
  await prisma.$disconnect()
}
reset()
