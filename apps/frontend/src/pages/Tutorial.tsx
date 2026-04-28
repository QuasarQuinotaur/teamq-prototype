import TutorialMask from "@/components/TutorialMask.tsx"
import Documents from "@/pages/Documents.tsx"
import {useParams} from "react-router-dom";


export default function Tutorial() {
    const { hidden } = useParams<{ hidden: string }>();




    return (
        <>
            <Documents />
            <TutorialMask disabled={hidden === "true"} />
        </>
    )
}