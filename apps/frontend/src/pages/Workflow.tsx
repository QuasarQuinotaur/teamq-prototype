import { useState, useEffect } from "react";
import { type CardEntry } from "@/components/Card.tsx";
import EntryPage from "@/components/EntryPage";

function Workflow() {
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    function fetchContent() {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const mapped: CardEntry[] = data.filter((item) => {
                    return item.contentType === "workflow"
                }).map((item) => ({
                    item: item,
                    title: item.title,
                    link: item.link,
                    description: item.ownerName,
                    badge: item.contentType,
                }));
                setEntries(mapped);
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => { fetchContent(); }, []);

    return (
        <>
            <EntryPage 
                entries={entries}
                defaultBadge={""}
                formButtonProps={{formType: "Document", onCancel: fetchContent}}
            />
        </>
    );
}

export default Workflow;
