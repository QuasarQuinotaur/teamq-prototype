import MinorTopbar from "@/components/MinorTopbar.tsx";
import PaginationControl from "@/components/Pagination";
import {
    CardGrid,
    type CardEntry
} from "@/components/CardGrid.tsx";
import { useOutletContext } from "react-router-dom";
import type { EmployeeWithContents } from "db";

function Workflow() {
    const employee: EmployeeWithContents = useOutletContext()
    const entries = employee.contents.filter((x) => x.contentType==="workflow").map((entry) => {
        return { title: entry.title, link: entry.link }
    });

    return (
        <>
            <MinorTopbar />
            {/* <CardGrid
                entries={entries}
                defaultBadge={"World"}
            /> */}
            <div>
                <PaginationControl docNum={8}/>
            </div>
        </>
    )
}


export default Workflow;