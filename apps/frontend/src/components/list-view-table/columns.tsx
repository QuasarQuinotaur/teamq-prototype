import type {ColumnDef} from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
    id: string
    tag: "Business Analyst" | "Underwriter"
    name: string
    link: string
}

export const columns: ColumnDef<Payment>[] = [
    {
        accessorKey: "name",
        header: "Title",
    },
    {
        accessorKey: "link",
        header: "Link",
    },
    {
        accessorKey: "tag",
        header: "Role",
    },
]