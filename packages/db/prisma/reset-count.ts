import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const result = await prisma.content.updateMany({
        data: { viewCount: 0, downloadCount: 0 }
    });
    console.log(`Reset ${result.count} documents`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());