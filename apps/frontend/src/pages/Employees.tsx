import EntryPage from "@/components/EntryPage.tsx";
import {useEffect, useState} from "react";
import type {CardEntry} from "@/components/Card.tsx";

export default function Employees(){
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetch('http://localhost:3000/employees', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const mapped: CardEntry[] = data.map((item: any) => ({
                    item,
                    title: `${item.firstName} ${item.lastName}`,
                    link: item.email,
                    description: item.jobPosition,
                    badge: item.jobPosition,
                }));
                setEntries(mapped);
            })
            .finally(() => setLoading(false));
    }, []);
    
    return (
        <>
            <EntryPage
                entries={entries}
                formButtonProps={{formType: "Employee"}}
            />
        </>
    );
}