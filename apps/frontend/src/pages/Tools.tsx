import { useState, useEffect } from "react";
import MinorTopbar from "@/components/MinorTopbar.tsx";
import Pagination from "@/components/Pagination.tsx";
import { CardGrid, type CardEntry } from "@/components/CardGrid.tsx";

function Tools() {
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/content', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const mapped: CardEntry[] = data.map((item: any) => ({
                    title: item.title,
                    link: item.link,
                    description: item.ownerName,
                    badge: item.contentType,
                })).filter((ce:CardEntry) => {
                    return ce.badge==='Tool'
                });
                setEntries(mapped);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <MinorTopbar />
            {loading ? (
                <p>Loading...</p>
            ) : (
                <CardGrid entries={entries} defaultBadge="Tool" />
            )}
            <div>
                <Pagination docNum={entries.length} />
            </div>
        </>
    );
}

export default Tools;