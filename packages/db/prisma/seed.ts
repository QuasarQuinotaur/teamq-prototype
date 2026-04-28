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
                email: "alice@example.com",
                dateOfBirth: new Date("1995-08-15"),
                jobPosition: "HR Manager",
                auth0Id: null,
            },
            {
                id: 2,
                firstName: "Bob",
                lastName: "Smith",
                email: "bob@example.com",
                dateOfBirth: new Date("1990-03-22"),
                jobPosition: "Financial Analyst",
                auth0Id: null,
            },
            {
                id: 3,
                firstName: "Carol",
                lastName: "White",
                email: "carol@example.com",
                dateOfBirth: new Date("1988-11-05"),
                jobPosition: "Marketing Specialist",
                auth0Id: null,
            },
            {
                id: 4,
                firstName: "David",
                lastName: "Brown",
                email: "david@example.com",
                dateOfBirth: new Date("1992-06-30"),
                jobPosition: "Project Manager",
                auth0Id: null,
            },
            {
                id: 5,
                firstName: "Eve",
                lastName: "Davis",
                email: "eve@example.com",
                dateOfBirth: new Date("1997-01-14"),
                jobPosition: "Operations Coordinator",
                auth0Id: null,
            },
            {
                id: 6,
                firstName: "Ben",
                lastName: "Santana",
                email: "ben.amaral.santana@gmail.com",
                dateOfBirth: new Date("1990-01-01"),
                jobPosition: "Software Engineer",
                auth0Id: null,
            },
        ],
    });

    const employees = await prisma.employee.findMany({ orderBy: { id: "asc" } });

    const contentTitles = [
        "Annual Report",
        "Budget Data",
        "Q1 Presentation",
        "Project Brief",
        "Meeting Summary",
    ];
    const contentTypes = ["document", "spreadsheet", "presentation", "pdf", "text"];

    await prisma.content.createMany({
        data: employees.slice(0, 5).map((e, i) => ({
            title: contentTitles[i]!,
            contentType: contentTypes[i]!,
            expirationDate: new Date("2026-12-31"),
            ownerId: e.id,
            jobPositions: [e.jobPosition],
        })),
    });

    const contents = await prisma.content.findMany({ orderBy: { id: "asc" } });

    const workflowSpecs: Array<{
        title: string;
        ownerId: number;
        assigneeIds: number[];
        contentIndex: number | null;
    }> = [
        { title: "Fix printer", ownerId: 1, assigneeIds: [1, 2], contentIndex: 0 },
        { title: "Update website", ownerId: 2, assigneeIds: [2, 3], contentIndex: 1 },
        { title: "Prepare report", ownerId: 3, assigneeIds: [3, 4], contentIndex: 2 },
        { title: "System maintenance", ownerId: 4, assigneeIds: [4, 5], contentIndex: 3 },
        { title: "Client meeting", ownerId: 5, assigneeIds: [5, 1], contentIndex: 4 },
    ];

    for (const spec of workflowSpecs) {
        const doc =
            spec.contentIndex !== null ? contents[spec.contentIndex] : undefined;
        await prisma.serviceRequestWorkflow.create({
            data: {
                ownerId: spec.ownerId,
                title: spec.title,
                stages: {
                    create: [
                        {
                            stageOrder: 1,
                            title: spec.title,
                            status: "to-do",
                            employees: {
                                connect: spec.assigneeIds.map((id) => ({ id })),
                            },
                            ...(doc
                                ? {
                                      contents: {
                                          connect: [{ id: doc.id }],
                                      },
                                  }
                                : {}),
                        },
                    ],
                },
            },
        });
    }

    console.log("Seed complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
