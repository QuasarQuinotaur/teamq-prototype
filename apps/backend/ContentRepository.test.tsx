import "dotenv/config";
import { expect, test, describe } from "vitest";
import { ContentRepository } from "./src/ContentRepository";

const contentRepository = new ContentRepository();
const now = new Date();

describe("ContentRepository Tests (hopefully no> no DB corruption)", () => {

    // read the database

    test("getAll returns existing seeded data", async () => {
        const results = await contentRepository.getAll();

        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toHaveProperty("id");
        expect(results[0]).toHaveProperty("owner");
    });

    test("getById returns correct item", async () => {
        const item = await contentRepository.getById(23);

        expect(item).not.toBeNull();
        expect(item?.id).toBe(23);
        expect(item?.owner).toBeDefined();
    });

    test("getByJobPosition filters correctly", async () => {
        const results = await contentRepository.getByJobPosition("admin");

        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => {
            expect(r.jobPosition).toBe("admin");
        });
    });

    test("getByOwner returns correct owner content", async () => {
        const results = await contentRepository.getByOwner(1234);

        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => {
            expect(r.ownerId).toBe(1234);
        });
    });

    // create a content

    test("create adds new content", async () => {
        let createdId: number | null = null;

        try {
            const created = await contentRepository.create({
                title: "TEST_CREATE",
                link: "test.com",
                ownerName: "Test User",
                jobPosition: "admin",
                contentType: "doc",
                status: "todo",
                expirationDate: now,
                ownerId: 1234
            });

            createdId = created.id;

            expect(created.title).toBe("TEST_CREATE");

            const fetched = await contentRepository.getById(createdId);
            expect(fetched?.title).toBe("TEST_CREATE");

        } finally {
            if (createdId) {
                await contentRepository.delete(createdId);
            }
        }
    });

    // update that table

    test("update modifies only created content", async () => {
        let createdId: number | null = null;

        try {
            const created = await contentRepository.create({
                title: "TEST_UPDATE",
                link: "test.com",
                ownerName: "Test User",
                jobPosition: "admin",
                contentType: "doc",
                status: "todo",
                expirationDate: now,
                ownerId: 1234
            });

            createdId = created.id;

            await contentRepository.update(createdId, {
                title: "UPDATED_TITLE"
            });

            const updated = await contentRepository.getById(createdId);

            expect(updated?.title).toBe("UPDATED_TITLE");

        } finally {
            if (createdId) {
                await contentRepository.delete(createdId);
            }
        }
    });

    //delete test <o/

    test("delete removes only created content", async () => {
        let createdId: number | null = null;

        try {
            const created = await contentRepository.create({
                title: "TEST_DELETE",
                link: "test.com",
                ownerName: "Test User",
                jobPosition: "admin",
                contentType: "doc",
                status: "todo",
                expirationDate: now,
                ownerId: 1234
            });

            createdId = created.id;

            await contentRepository.delete(createdId);

            const deleted = await contentRepository.getById(createdId);

            expect(deleted).toBeNull();

            createdId = null; // already deleted

        } finally {
            if (createdId) {
                await contentRepository.delete(createdId);
            }
        }
    });

});
import { ServiceRequestRepository } from "./src/ServiceRequestRepository";
const sRepository = new ServiceRequestRepository();
test("getallEmpty", async () =>{
    const results = await sRepository.getAll();
    expect(results).toEqual([]);
})