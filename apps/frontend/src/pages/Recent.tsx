import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import ContentEntryPage from "@/components/paging/ContentEntryPage.tsx";

export default function Recent() {
    return (
        <ContentEntryPage onlyRecents/>
    )
}