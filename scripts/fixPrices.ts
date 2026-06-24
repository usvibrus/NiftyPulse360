import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fix() {
  await prisma.metalEvent.update({
    where: { slug: 'why-gold-price-fell-today-2026-05-15' },
    data: { pricePerGram: 15693 }
  })
  await prisma.metalEvent.update({
    where: { slug: 'why-silver-price-fell-today-2026-05-15' },
    data: { pricePerGram: 280 }
  })
  console.log('Fixed: Gold ₹15,693/g, Silver ₹280/g')
  await prisma.$disconnect()
}
fix()

// Script validated
