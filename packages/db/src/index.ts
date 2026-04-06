import { Prisma } from "../generated/prisma/client.js";

export { prisma } from "./client.js"; // exports instance of prisma
export * from "../generated/prisma/client.js"; // exports generated types from prisma

export type EmployeeWithContents = Prisma.EmployeeGetPayload<{
  include: { contents: true }
}>;