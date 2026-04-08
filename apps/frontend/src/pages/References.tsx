import { useState, useEffect } from "react";
import MinorTopbar from "@/components/MinorTopbar.tsx";
import Pagination from "@/components/Pagination.tsx";
import { CardGrid } from "@/components/CardGrid.tsx";
import { type CardEntry } from "@/components/Card";
import type { Content } from "db";
import EntryPage from "@/components/EntryPage";

function References() {
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/content', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const mapped: CardEntry[] = data.filter((item) => {
                    return item.contentType === "Reference"
                }).map((item) => {
                    console.log(item);
                    return {
                        item: item,
                        title: item.title,
                        link: item.link,
                        description: item.ownerName,
                        badge: item.contentType,
                    }
                });
                setEntries(mapped);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        // <>
        //     <MinorTopbar />
        //     {loading ? (
        //         <p>Loading...</p>
        //     ) : (
        //         <CardGrid entries={entries} defaultBadge="Reference" />
        //     )}
        //     <div>
        //         <Pagination docNum={entries.length} />
        //     </div>
        // </>
        <EntryPage
            entries={entries}
            defaultBadge={"Workflow"}
            formButtonProps={{formType: "Document"}}
        />
    );
}

export default References;