import { useState, useEffect } from "react";
import { type CardEntry } from "@/components/Card";
import EntryPage from "@/components/EntryPage";

function Tools() {
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/content', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const mapped: CardEntry[] = data.filter((item) => {
                    return item.contentType === "Tool"
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
                defaultBadge={"Tool"}
                formButtonProps={{formType: "Document"}}
            />
        </>
    );
}

export default Tools;