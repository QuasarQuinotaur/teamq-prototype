import MinorTopbar from "@/components/MinorTopbar.tsx";
import Pagination from "@/components/Pagination.tsx";
import {
    CardGrid,
    type CardEntry
} from "@/components/CardGrid.tsx";
import { useOutletContext } from "react-router-dom";
import type { EmployeeWithContents } from "db";

function Tools() {
    const employee: EmployeeWithContents = useOutletContext()
    const entries = employee.contents.filter((x) => x.contentType==="tool").map((entry) => {
        return { title: entry.title, link: entry.link }
    });

    return (
        <>
            <MinorTopbar />
            <CardGrid
                entries={entries}
                defaultBadge={"Tool"}
            />
            <div>
                <Pagination docNum={8}/>
            </div>
        </>
    )
}


export default Tools;