import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("=== EMPLOYEES ===");
    const employees = await prisma.employee.findMany({ orderBy: { id: "asc" } });
    employees.forEach((emp) => {
        console.log(`[${emp.id}] ${emp.firstName} ${emp.lastName} | ${emp.jobPosition} | DOB: ${emp.dateOfBirth.toDateString()}`);
    });

    console.log("\n=== CONTENT ===");
    const contents = await prisma.content.findMany({ orderBy: { id: "asc" }, include: { owner: true } });
    contents.forEach((c) => {
        console.log(`[${c.id}] ${c.title} | ${c.contentType} | ${c.status} | Owner: ${c.ownerName}`);
    });
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });