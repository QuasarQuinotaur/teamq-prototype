import { useParams } from "react-router-dom";
import ContentEntryPage from "@/components/paging/ContentEntryPage.tsx";

export default function RoleDocuments() {
    const { role } = useParams<{ role: string }>();
    return <ContentEntryPage jobPosition={role} />;
}
