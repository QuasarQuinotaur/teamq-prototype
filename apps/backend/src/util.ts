import { Employee, prisma } from "db";

export async function getEmployeePermissionLevel(employee: Employee): Promise<number> {
    const role = await prisma.role.findUnique({
        where: { key: employee.jobPosition },
    });
    return role ? role.permissionLevel : -1
}

export function getPermissionLevelIsAdmin(permissionLevel: number) {
    return permissionLevel >= 1
}


export async function getEmployeeIsAdmin(employee: Employee) {
    return getPermissionLevelIsAdmin(await getEmployeePermissionLevel(employee))
}