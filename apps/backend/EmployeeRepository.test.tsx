import "dotenv/config";
import { expect, test, describe } from "vitest";
import { EmployeeRepository } from "./src/EmployeeRepository";

const employeeRepository = new EmployeeRepository();
const now = new Date();

describe("EmployeeRepository Tests (SAFE)", () => {

    // basic read

    test("getAll returns seeded employees", async () => {
        const results = await employeeRepository.getAll();

        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toHaveProperty("id");
        expect(results[0]).toHaveProperty("email");
    });

    test("getById returns correct employee", async () => {
        const employee = await employeeRepository.getById(1234);

        expect(employee).not.toBeNull();
        expect(employee?.id).toBe(1234);
        expect(employee?.email).toBe("ben.amaral.santana@gmail.com");
    });

    test("getByEmail returns correct employee", async () => {
        const employee = await employeeRepository.getByEmail("norahjanderson@gmail.com");

        expect(employee).not.toBeNull();
        expect(employee?.firstName).toBe("Norah");
    });

    test("getByAuth0Id returns correct employee", async () => {
        const employee = await employeeRepository.getByAuth0Id("google-oauth2|112822472543720132229");

        expect(employee).not.toBeNull();
        expect(employee?.id).toBe(1234);
    });

    test("getByJobPosition filters correctly", async () => {
        const results = await employeeRepository.getByJobPosition("admin");

        expect(results.length).toBeGreaterThan(0);
        results.forEach(emp => {
            expect(emp.jobPosition).toBe("admin");
        });
    });

    // create

    test("create adds new employee", async () => {
        let createdId: number | null = null;

        try {
            const created = await employeeRepository.create2({
                email: "testuser_unique@gmail.com",
                firstName: "Test",
                lastName: "User",
                dateOfBirth: now,
                jobPosition: "admin"
            });

            createdId = created.id;

            expect(created.email).toBe("testuser_unique@gmail.com");

            const fetched = await employeeRepository.getById(createdId);
            expect(fetched?.email).toBe("testuser_unique@gmail.com");

        } finally {
            if (createdId) {
                await employeeRepository.delete(createdId);
            }
        }
    });

    // update

    test("update modifies only created employee", async () => {
        let createdId: number | null = null;

        try {
            const created = await employeeRepository.create2({
                email: "updateuser_unique@gmail.com",
                firstName: "Old",
                lastName: "Name",
                dateOfBirth: now,
                jobPosition: "admin"
            });

            createdId = created.id;

            await employeeRepository.update(createdId, {
                firstName: "New"
            });

            const updated = await employeeRepository.getById(createdId);

            expect(updated?.firstName).toBe("New");

        } finally {
            if (createdId) {
                await employeeRepository.delete(createdId);
            }
        }
    });

    // auth0 test???

    test("linkAuth0 updates auth0Id by email", async () => {
        let createdId: number | null = null;

        try {
            const created = await employeeRepository.create2({
                email: "authuser_unique@gmail.com",
                firstName: "Auth",
                lastName: "User",
                dateOfBirth: now,
                jobPosition: "admin"
            });

            createdId = created.id;

            await employeeRepository.linkAuth0(
                "authuser_unique@gmail.com",
                "auth0|TEST123"
            );

            const updated = await employeeRepository.getByEmail("authuser_unique@gmail.com");

            expect(updated?.auth0Id).toBe("auth0|TEST123");

        } finally {
            if (createdId) {
                await employeeRepository.delete(createdId);
            }
        }
    });

    // delete

    test("delete removes only created employee", async () => {
        let createdId: number | null = null;

        try {
            const created = await employeeRepository.create2({
                email: "deleteuser_unique@gmail.com",
                firstName: "Delete",
                lastName: "Me",
                dateOfBirth: now,
                jobPosition: "admin"
            });

            createdId = created.id;

            await employeeRepository.delete(createdId);

            const deleted = await employeeRepository.getById(createdId);

            expect(deleted).toBeNull();

            createdId = null; // prevent double delete

        } finally {
            if (createdId) {
                await employeeRepository.delete(createdId);
            }
        }
    });

});