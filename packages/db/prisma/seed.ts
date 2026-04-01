import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.employee.createMany({
        data: [
            { id: 1, firstName: "Alice", lastName: "Johnson", dateOfBirth: new Date("1995-08-15"), jobPosition: "HR Manager" },
            { id: 2, firstName: "Bob", lastName: "Smith", dateOfBirth: new Date("1990-03-22"), jobPosition: "Financial Analyst" },
            { id: 3, firstName: "Carol", lastName: "White", dateOfBirth: new Date("1988-11-05"), jobPosition: "Marketing Specialist" },
            { id: 4, firstName: "David", lastName: "Brown", dateOfBirth: new Date("1992-06-30"), jobPosition: "Project Manager" },
            { id: 5, firstName: "Eve", lastName: "Davis", dateOfBirth: new Date("1997-01-14"), jobPosition: "Operations Coordinator" },
        ],
    });

    const employees = await prisma.employee.findMany({ orderBy: { id: "asc" } });

    await prisma.content.createMany({
        data: [
            { title: "Annual Report", link: "content-files/dummy-report.docx", ownerName: `${employees[0].firstName} ${employees[0].lastName}`, jobPosition: employees[0].jobPosition, contentType: "document", status: "active", expirationDate: new Date("2026-12-31"), ownerId: employees[0].id },
            { title: "Budget Data", link: "content-files/dummy-data.xlsx", ownerName: `${employees[1].firstName} ${employees[1].lastName}`, jobPosition: employees[1].jobPosition, contentType: "spreadsheet", status: "active", expirationDate: new Date("2026-12-31"), ownerId: employees[1].id },
            { title: "Q1 Presentation", link: "content-files/dummy-slide.pptx", ownerName: `${employees[2].firstName} ${employees[2].lastName}`, jobPosition: employees[2].jobPosition, contentType: "presentation", status: "active", expirationDate: new Date("2026-12-31"), ownerId: employees[2].id },
            { title: "Project Brief", link: "content-files/dummy-report-1.pdf", ownerName: `${employees[3].firstName} ${employees[3].lastName}`, jobPosition: employees[3].jobPosition, contentType: "pdf", status: "archived", expirationDate: new Date("2026-12-31"), ownerId: employees[3].id },
            { title: "Meeting Summary", link: "content-files/dummy-document.textClipping", ownerName: `${employees[4].firstName} ${employees[4].lastName}`, jobPosition: employees[4].jobPosition, contentType: "text", status: "draft", expirationDate: new Date("2026-12-31"), ownerId: employees[4].id },
        ],
    });

    console.log("✅ Seed complete!");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });