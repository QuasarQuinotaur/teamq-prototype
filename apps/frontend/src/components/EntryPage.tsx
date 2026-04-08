import { useState } from "react";
import * as React from "react";

import MinorTopbar, {type ViewType} from "@/components/MinorTopbar.tsx";
import Pagination from "@/components/Pagination.tsx";
import { CardGrid } from "@/components/CardGrid.tsx";
import { type CardEntry } from "@/components/Card.tsx";
import CardList from "@/components/list-view-table/CardList.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/DropdownMenu.tsx";
import {
    Dialog,
    DialogContent,
    DialogTrigger
} from "@/components/Dialog.tsx";
import {
    Dialog as AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/AlertDialog.tsx";
import {
    ArrowsClockwiseIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import {
    FormAddButton,
    FormWindow,
    type FormType,
    type FormWindowProps
} from "@/components/forms/Form.tsx";

const DEFAULT_UPDATE_FORM_HEADERS: Record<FormType, string> = {
    Document: "Update Document",
    Employee: "Update Employee"
}


type UpdateDeleteDropdownProps = {
    entry: CardEntry;
    trigger: React.ReactNode;
    formProps: FormWindowProps;
    onDelete: (entry: CardEntry) => void;
}
function UpdateDeleteDropdown({
                                  entry,
                                  trigger,
                                  formProps,
                                  onDelete,
}: UpdateDeleteDropdownProps) {
    const [updateFormOpen, setUpdateFormOpen] = useState(false)

    // All cards currently use this dropdown
    return (
        <Dialog open={updateFormOpen} onOpenChange={setUpdateFormOpen}>
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                            <DialogTrigger asChild>
                                <DropdownMenuItem>
                                    <ArrowsClockwiseIcon/>
                                    Update
                                </DropdownMenuItem>
                            </DialogTrigger>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem variant="destructive">
                                    <TrashIcon />
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => onDelete(entry)}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <DialogContent className={"sm:max-w-sm"}>
                <FormWindow
                    header={DEFAULT_UPDATE_FORM_HEADERS[formProps.formType]}
                    headerMargin={false}
                    {...formProps}
                    fromItem={entry.item}
                    onCancel={() => {
                        if (formProps.onCancel) {
                            formProps.onCancel()
                        }
                        setUpdateFormOpen(false)
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}

type EntryPageProps = {
    entries: CardEntry[];
    defaultBadge: string;
    formButtonProps?: FormWindowProps;
    renderCard?: (entry: CardEntry, optionsWrapper?: (trigger: React.ReactNode) => React.ReactNode) => React.ReactNode;
    onDelete?: (entry: CardEntry) => Promise<void>;
}
export default function EntryPage({
                                         entries: initialEntries,
                                         defaultBadge,
                                         formButtonProps,
                                         renderCard,
                                         onDelete,
}: EntryPageProps) {
    // for view type (grid vs. list)
    const [view, setView] = useState<ViewType>("Grid");
    const [entries, setEntries] = useState<CardEntry[]>(initialEntries);

    React.useEffect(() => {
        setEntries(initialEntries);
    }, [initialEntries]);

    // note/bug: if u switch to list, visit another page and come back, it will be back to grid

    async function handleDelete(entry: CardEntry) {
        const item = entry.item as { id: number };
        try {
            if (onDelete) {
                await onDelete(entry);
            } else {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/content/${item.id}`, {
                    method: "DELETE",
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Delete failed");
            }
            setEntries((prev) => prev.filter((e) => (e.item as { id: number }).id !== item.id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }

    const extraElements: React.ReactNode[] = formButtonProps ? [FormAddButton(formButtonProps)] : [];
    const entryOptionsWrapper = (
        formButtonProps ? (
            (entry: CardEntry, trigger: React.ReactNode): React.ReactNode => (
                UpdateDeleteDropdown({
                    entry,
                    trigger,
                    formProps: formButtonProps,
                    onDelete: handleDelete,
                })
            )
        ) : undefined
    )

    return (
        <>
            <MinorTopbar
                view={view}
                setView={setView}
                extraElements={extraElements}
            />
            {view === "Grid" ?
                (
                    <CardGrid
                        entries={entries}
                        defaultBadge={defaultBadge}
                        entryOptionsWrapper={entryOptionsWrapper}
                        renderCard={renderCard}
                    />
                ) :
                (
                    <CardList entries={entries} optionsWrapper={entryOptionsWrapper} />
                )}
            <div>
                <Pagination docNum={entries.length}/>
            </div>
        </>
    )
}