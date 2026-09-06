// Single shared Prisma client. Next.js reloads modules in dev, which would
// otherwise open a fresh database connection on every edit — this keeps one
// instance around on the global object so that doesn't happen.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
