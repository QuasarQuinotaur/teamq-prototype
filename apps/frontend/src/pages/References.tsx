import MinorTopbar from "@/components/MinorTopbar.tsx";
import CardImage from "../components/cardImage.tsx";
import PaginationControl from "../components/paginationControl"


function References() {


    return (
        <>
            <MinorTopbar/>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <CardImage
                    title="ISOnet Website"
                    description=""
                    badge="Reference"
                    action="View"
                    link="https://github.com"
                />
                <CardImage
                    title="Forms Knowledge Base"
                    description=""
                    badge="Reference"
                    action="View"
                    link="https://github.com"
                />
                <CardImage
                    title="Coastal Guidelines"
                    description=""
                    badge="Reference"
                    action="View"
                    link="https://github.com"
                />
                <CardImage
                    title="CPP Rater"
                    description=""
                    badge="Reference"
                    action="View"
                    link="https://github.com"
                />
                <CardImage
                    title="Experience & Schedule Rating Plans"
                    description=""
                    badge="Reference"
                    action="View"
                    link="https://github.com"
                />
                <CardImage
                    title="States on Hold"
                    description=""
                    badge="Reference"
                    action="View"
                    link="https://github.com"
                />
                <CardImage
                    title="PMS URG"
                    description=""
                    badge="Reference"
                    action="View"
                    link="https://github.com"
                />
            </div>
            <div>
                <PaginationControl docNum={7}/>
            </div>
        </>
    )
}


export default References;