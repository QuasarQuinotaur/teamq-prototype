// ContentEntryPage used for Workflow/Reference/Tools pages
// It makes an EntryPage with Card + List view showing all content
// A specific type can be specified (workflow, reference, tool) to only show that type of content

import {useEffect, useState} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content} from "db";
import * as React from "react";
import EntryPage from "@/components/paging/EntryPage.tsx";
import ContentCard from "@/components/cards/ContentCard.tsx";
import type {FormWindowProps} from "@/components/forms/FormWindow.tsx";
import FormAddButton from "@/components/forms/FormAddButton.tsx";
import ModifyDropdown from "@/components/paging/ModifyDropdown.tsx";


type ContentEntryPageProps = {
    contentType?: string;
}
export default function ContentEntryPage({
                                             contentType
}: ContentEntryPageProps) {
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // This gets all content for the signed-in user
    function fetchContent() {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content`, { credentials: 'include' })
            .then(res => res.json())
            .then((data: Content[]) => {
                const mapped: CardEntry[] = data.filter((item) => {
                    return item.contentType === contentType
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
    useEffect(() => {
        fetchContent()
    }, []);

    // Delete content
    async function handleDelete(entry: CardEntry) {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${entry.item.id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error("Delete failed");
        }
    }

    // Use Document form with default content type
    const formProps: FormWindowProps = {
        formType: "Document",
        onCancel: fetchContent,
        defaultItem: {
            contentType: contentType
        }
    }

    // Create toolbar button for Add Document Form
    const formAddButton = FormAddButton(formProps)

    // Make card "..." show dropdown to modify documents
    const createOptionsElement =
        (entry: CardEntry, trigger: React.ReactNode) => (
            ModifyDropdown({
                entry,
                trigger,
                updateFormProps: formProps,
                handleDelete: handleDelete,
            })
        )

    return (
        <EntryPage
            entries={entries}
            createOptionsElement={createOptionsElement}
            cardGridProps={{
                renderCard: ((state) => (
                    // Uses content card for grid
                    <ContentCard
                        action="View"
                        key={state.entry.item.id}
                        {...state}
                    />
                )),
            }}
            extraToolbarElements={[formAddButton]}
        />
    )
}