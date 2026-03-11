import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! as string });

// pg → the standard Node.js PostgreSQL driver library
// @prisma/adapter-pg → wraps pg so Prisma can use it
// Prisma → uses the adapter to query your Supabase database

const prisma = new PrismaClient({
    adapter,
    log: ["query"]
});

export default prisma;
