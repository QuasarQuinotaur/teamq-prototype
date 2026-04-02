import CardImage from "../components/cardImage.tsx";
import PaginationControl from "@/components/paginationControl.tsx";



function Tools() {
    return (
        <>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <CardImage
                    title="Desktop Management Tool"
                    description=""
                    badge="Tool"
                    action="view"
                    link="https://github.com"
                />
                <CardImage
                    title="Error Lookup Tool"
                    description=""
                    badge="Tool"
                    action="view"
                    link="https://github.com"
                />
                <CardImage
                    title="Workaround Tool"
                    description=""
                    badge="Tool"
                    action="view"
                    link="https://github.com"
                />
                <CardImage
                    title="IPS"
                    description=""
                    badge="Tool"
                    action="view"
                    link="https://github.com"
                />
                <CardImage
                    title="RiskMeter Online"
                    description=""
                    badge="Tool"
                    action="view"
                    link="https://github.com"
                />
                <CardImage
                    title="Property View"
                    description=""
                    badge="Tool"
                    action="view"
                    link="https://github.com"
                />
                <CardImage
                    title="Underwriting Workstation"
                    description=""
                    badge="Tool"
                    action="view"
                    link="https://github.com"
                />
                <CardImage
                    title="Kentucky Tax and Tax Exemption Job Aid"
                    description=""
                    badge="Tool"
                    action="view"
                    link="https://github.com"
                />
            </div>
            <div>
                <PaginationControl docNum={8}/>
            </div>
        </>
    )
}


export default Tools;