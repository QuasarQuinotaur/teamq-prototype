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
}
function UpdateDeleteDropdown({
                                  entry,
                                  trigger,
                                  formProps
}: UpdateDeleteDropdownProps) {
    const [updateFormOpen, setUpdateFormOpen] = useState(false)

    // All cards currently use this dropdown
    return (
        <Dialog open={updateFormOpen} onOpenChange={setUpdateFormOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuGroup>
                        <DialogTrigger asChild>
                            <DropdownMenuItem >
                                <ArrowsClockwiseIcon/>
                                Update
                            </DropdownMenuItem>
                        </DialogTrigger>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {/*Todo: Make it delete on backend*/}
                        <DropdownMenuItem variant="destructive">
                            <TrashIcon />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
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
}
export default function EntryPage({
                                         entries,
                                         defaultBadge,
                                         formButtonProps
}: EntryPageProps) {
    // for view type (grid vs. list)
    const [view, setView] = useState<ViewType>("Grid");


    // <div>
    //     <b>Last Modified: </b>
    //     {formatDate(entry.content.dateUpdated)}
    //     <br/>
    //     <b>Expiration Date: </b>
    //     {formatDate(entry.content.expirationDate)}
    // </div>

    // note/bug: if u switch to list, visit another page and come back, it will be back to grid

    const extraElements: React.ReactNode[] = formButtonProps ? [FormAddButton(formButtonProps)] : [];
    const entryOptionsWrapper = (
        formButtonProps ? (
            (entry: CardEntry, trigger: React.ReactNode): React.ReactNode => (
                UpdateDeleteDropdown({
                    entry,
                    trigger,
                    formProps: formButtonProps
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
                    />
                ) :
                (
                    <CardList />
                )}
            <div>
                <Pagination docNum={8}/>
            </div>
        </>
    )
}