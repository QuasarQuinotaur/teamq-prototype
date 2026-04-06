import MinorTopbar from "@/components/MinorTopbar.tsx";
import PaginationControl from "../components/paginationControl"
import {
    CardGrid,
    type CardEntry
} from "@/components/CardGrid.tsx";


function References() {
    // TODO get from backend
    const entries: CardEntry[] = [
        {
            title: "ISOnet Website",
            link: "https://github.com"
        },
        {
            title: "Forms Knowledge Base",
            link: "https://github.com"
        },
        {
            title: "Coastal Guidelines",
            link: "https://github.com"
        },
        {
            title: "CPP Rater",
            link: "https://github.com"
        },
        {
            title: "Experience & Schedule Rating Plans",
            link: "https://github.com"
        },
        {
            title: "States on Hold",
            link: "https://github.com"
        },
        {
            title: "PMS URG",
            link: "https://github.com"
        },
    ]


    return (
        <>
            <MinorTopbar/>
            <CardGrid
                entries={entries}
                defaultBadge={"Reference"}
            />
            <div>
                <PaginationControl docNum={7}/>
            </div>
        </>
    )
}


export default References;