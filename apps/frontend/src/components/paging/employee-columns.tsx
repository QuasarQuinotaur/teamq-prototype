import type { CreateColumnsOptions } from "@/components/cards/list-view-table/columns";

export const EMPLOYEE_LIST_COLUMNS: CreateColumnsOptions = {
    createColumns: () => [
        {
            id: "employee",
            header: "Name",
            cell: ({ entry }) => {
                const emp = entry.item;

                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={emp.image || "/placeholder.png"}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                        <span>
                            {emp.firstName} {emp.lastName}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "role",
            header: "Role",
            cell: ({ entry }) => {
                const emp = entry.item;
                return (
                    <span className="text-muted-foreground">
                        {emp.jobPosition}
                    </span>
                );
            },
        },
    ],
};