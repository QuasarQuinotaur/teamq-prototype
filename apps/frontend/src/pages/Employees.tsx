import EntryPage from "@/components/EntryPage.tsx";
import {useEffect, useState} from "react";
import type {CardEntry} from "@/components/Card.tsx";
import EmployeeCard from "@/components/EmployeeCard.tsx";
import * as React from "react";

export default function Employees(){
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    function fetchEmployees() {
        fetch('http://localhost:3000/employees', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const mapped: CardEntry[] = data.map((item: any) => ({
                    item,
                    title: `${item.firstName} ${item.lastName}`,
                    link: item.email,
                    description: item.email,
                    badge: item.jobPosition ? item.jobPosition.charAt(0).toUpperCase() + item.jobPosition.slice(1) : item.jobPosition,
                    image: item.image ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(item.firstName + ' ' + item.lastName)}`,
                }));
                setEntries(mapped);
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => { fetchEmployees(); }, []);

    async function handleDelete(entry: CardEntry) {
        const item = entry.item as { id: number };
        const res = await fetch(`http://localhost:3000/employees/${item.id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Delete failed");
    }

    return (
        <>
            <EntryPage
                entries={entries}
                defaultBadge=""
                formButtonProps={{formType: "Employee", onCancel: fetchEmployees}}
                onDelete={handleDelete}
                renderCard={(entry, optionsWrapper) => (
                    <EmployeeCard
                        key={(entry.item as { id: number }).id}
                        entry={entry}
                        badges={[]}
                        action="View"
                        optionsWrapper={optionsWrapper}
                    />
                )}
            />
        </>
    );
}