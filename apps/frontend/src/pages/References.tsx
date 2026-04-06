import MinorTopbar from "@/components/MinorTopbar.tsx";
import Pagination from "../components/Pagination.tsx"
import {
    CardGrid,
    type CardEntry
} from "@/components/CardGrid.tsx";
import type { EmployeeWithContents } from "db";
import { useOutletContext } from "react-router-dom";


function References() {
    const employee: EmployeeWithContents = useOutletContext()
    const entries = employee.contents.filter((x) => x.contentType==="reference").map((entry) => {
        return { title: entry.title, link: entry.link }
    });

    return (
        <>
            <MinorTopbar/>
            <CardGrid
                entries={entries}
                defaultBadge={"Reference"}
            />
            <div>
                <Pagination docNum={7}/>
            </div>
        </>
    )
}


export default References;