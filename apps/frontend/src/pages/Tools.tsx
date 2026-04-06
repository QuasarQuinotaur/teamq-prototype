import MinorTopbar from "@/components/MinorTopbar.tsx";
import PaginationControl from "@/components/paginationControl.tsx";
import {
    CardGrid,
    type CardEntry
} from "@/components/CardGrid.tsx";

function Tools() {
    // TODO get from backend
    const entries: CardEntry[] = [
        {
            title: "Desktop Management Tool",
            link: "https://github.com"
        },
        {
            title: "Error Lookup Tool",
            link: "https://github.com"
        },
        {
            title: "Workaround Tool",
            link: "https://github.com"
        },
        {
            title: "IPS",
            link: "https://github.com"
        },
        {
            title: "RiskMeter Online",
            link: "https://github.com"
        },
        {
            title: "Property View",
            link: "https://github.com"
        },
        {
            title: "Underwriting Workstation",
            link: "https://github.com"
        },
        {
            title: "Kentucky Tax and Tax Exemption Job Aid",
            link: "https://github.com"
        },
    ]

    return (
        <>
            <MinorTopbar />
            <CardGrid
                entries={entries}
                defaultBadge={"Tool"}
            />
            <div>
                <PaginationControl docNum={8}/>
            </div>
        </>
    )
}


export default Tools;