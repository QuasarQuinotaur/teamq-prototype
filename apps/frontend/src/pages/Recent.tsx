import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";

export default function Recent(){
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 px-4 relative">
                <SidebarTrigger className="-ml-1" />
                <h1 className="font-heading absolute left-1/2 -translate-x-1/2 text-2xl">Recent</h1>
            </header>
        </>
    )
}