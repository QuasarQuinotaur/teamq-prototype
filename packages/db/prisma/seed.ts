import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";



const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.employee.createMany({
        data: [
            { 
                id: 1, 
                firstName: "Alice", 
                lastName: "Johnson", 
                email: "alice@example.com", // Added required unique email
                dateOfBirth: new Date("1995-08-15"), 
                jobPosition: "HR Manager",
                auth0Id: null 
            },
            { 
                id: 2, 
                firstName: "Bob", 
                lastName: "Smith", 
                email: "bob@example.com", 
                dateOfBirth: new Date("1990-03-22"), 
                jobPosition: "Financial Analyst",
                auth0Id: null 
            },
            { 
                id: 3, 
                firstName: "Carol", 
                lastName: "White", 
                email: "carol@example.com", 
                dateOfBirth: new Date("1988-11-05"), 
                jobPosition: "Marketing Specialist",
                auth0Id: null 
            },
            { 
                id: 4, 
                firstName: "David", 
                lastName: "Brown", 
                email: "david@example.com", 
                dateOfBirth: new Date("1992-06-30"), 
                jobPosition: "Project Manager",
                auth0Id: null 
            },
            { 
                id: 5, 
                firstName: "Eve", 
                lastName: "Davis", 
                email: "eve@example.com", 
                dateOfBirth: new Date("1997-01-14"), 
                jobPosition: "Operations Coordinator",
                auth0Id: null 
            },
            { 
                id: 6, 
                firstName: "Ben", 
                lastName: "Santana", 
                email: "ben.amaral.santana@gmail.com", 
                dateOfBirth: new Date("1990-01-01"), // Added placeholder DOB
                jobPosition: "Software Engineer",     // Added placeholder Position
                auth0Id: null 
            },
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

    await prisma.serviceRequest.createMany({
        data: [
            { id: 1, type: "Fix printer", creatorID: 1, requesteeID: 2 },
            { id: 2, type: "Update website", creatorID: 2, requesteeID: 3 },
            { id: 3, type: "Prepare report", creatorID: 3, requesteeID: 4 },
            { id: 4, type: "System maintenance", creatorID: 4, requesteeID: 5 },
            { id: 5, type: "Client meeting", creatorID: 5, requesteeID: 1 },
        ],
    });

    console.log("Seed complete!");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });