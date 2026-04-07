import { useState, useEffect } from "react";
import MinorTopbar from "@/components/MinorTopbar.tsx";
import Pagination from "@/components/Pagination.tsx";
import { CardGrid } from "@/components/CardGrid.tsx";
import { type CardEntry } from "@/components/Card";
import type { Content } from "db";
import EntryPage from "@/components/EntryPage";

function Tools() {
    const [entries, setEntries] = useState<CardEntry<Content>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/content', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const mapped: CardEntry<Content>[] = data.map((item: any) => ({
                    title: item.title,
                    link: item.link,
                    description: item.ownerName,
                    badge: item.contentType,
                })).filter((ce:CardEntry<Content>) => {
                    return ce.badge==='Tool'
                });
                setEntries(mapped);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <EntryPage 
                        getItems={() => entries}
                        defaultBadge={"Workflow"}
                        formButtonProps={{formType: "Document"}}
            />
        </>
    );
}

export default Tools;