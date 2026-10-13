import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

// Cache the client on globalThis in every environment so the server never spins up a
// second query engine and connection pool if this module is evaluated more than once.
globalForPrisma.prisma = prisma
