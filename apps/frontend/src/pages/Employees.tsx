import EntryPage from "@/components/EntryPage.tsx";
import {useEffect, useState} from "react";
import type {CardEntry} from "@/components/Card.tsx";
import type {Content} from "db";

export default function Employees(){
    return (
        <>
        </>
    )
    // const [entries, setEntries] = useState<CardEntry<Content>[]>([]);
    // const [loading, setLoading] = useState(true);
    //
    // useEffect(() => {
    //     fetch('http://localhost:3000/content', { credentials: 'include' })
    //         .then(res => res.json())
    //         .then(data => {
    //             const mapped: CardEntry<Content>[] = data.map((item: any) => ({
    //                 title: item.title,
    //                 link: item.link,
    //                 description: item.ownerName,
    //                 badge: item.contentType,
    //             })).filter((ce:CardEntry<Content>) => {
    //                 return ce.badge==='Tool'
    //             });
    //             setEntries(mapped);
    //         })
    //         .finally(() => setLoading(false));
    // }, []);
    //
    // return (
    //     <>
    //         <EntryPage
    //             entries={entries}
    //             defaultBadge={"Employee"}
    //             formButtonProps={{formType: "Employee"}}
    //         />
    //     </>
    // );
}