//import { CardEntry} from "@/components/CardGrid.tsx";

import { columns, type Payment } from "./columns.tsx"
import { DataTable } from "./data-table.tsx"

function getData(): Promise<Payment[]> {
    // Fetch data from your API here.
    return [
        {
            id: "728ed52f",
            tag: "Underwriter",
            name: "Title 1",
            link: "https://google.com",
        },
        // ...
    ]
}

export default function CardList() {
    const data = getData()

    return (
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={data} />
        </div>
    )
}

// TODO: not connected to data properly