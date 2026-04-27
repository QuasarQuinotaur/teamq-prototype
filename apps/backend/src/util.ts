import { Employee, prisma } from "db";


export async function getEmployeeIsAdmin(employee: Employee) {
    // previous check
    // return employee.jobPosition.toLowerCase() === "admin"
    const role = await prisma.role.findUnique({
        where: { key: employee.jobPosition },
    });
    return role && role.permissionLevel >= 1
}