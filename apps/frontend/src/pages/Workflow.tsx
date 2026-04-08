import { useState, useEffect } from "react";
import MinorTopbar from "@/components/MinorTopbar.tsx";
import Pagination from "@/components/Pagination.tsx";
import { CardGrid } from "@/components/CardGrid.tsx";
import { type CardEntry } from "@/components/Card.tsx";
import type { Content } from "db";
import EntryPage from "@/components/EntryPage";

function Workflow() {
    const [entries, setEntries] = useState<CardEntry<Content>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/content', { credentials: 'include' })
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