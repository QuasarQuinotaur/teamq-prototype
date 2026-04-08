import { useState, useEffect } from "react";
import { type CardEntry } from "@/components/Card.tsx";
import EntryPage from "@/components/EntryPage";


function Workflow() {
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/content', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const mapped: CardEntry[] = data.filter((item) => {
                    return item.contentType === "Workflow"
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
    }, []);

    return (
        <>
            <EntryPage 
                entries={entries}
                defaultBadge={"Workflow"}
                formButtonProps={{formType: "Document"}}
            />
        </>
    );
}

export default Workflow;