import TutorialMask from "@/components/TutorialMask.tsx"
import Documents from "@/pages/Documents.tsx"


export default function Tutorial() {
    return (
        <>
            <Documents />
            <TutorialMask disabled={false} />
        </>
    )
}