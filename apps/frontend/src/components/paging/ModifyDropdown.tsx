// Dropdown used for cards to modify data, shown using "trigger" element
// Includes Update option to update using form with pre-filled in data
// Includes Delete option to delete

import type {CardEntry} from "@/components/cards/Card.tsx";
import * as React from "react";
import FormWindow, {type FormType, type FormWindowProps} from "@/components/forms/FormWindow.tsx";
import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/DropdownMenu.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/dialog/AlertDialog.tsx";
import {ArrowsClockwiseIcon, TrashIcon} from "@phosphor-icons/react";


const DEFAULT_UPDATE_FORM_HEADERS: Record<FormType, string> = {
    Document: "Update Document",
    Employee: "Update Employee"
}

type ModifyDropdownProps = {
    entry: CardEntry;
    trigger: React.ReactNode;
    updateFormProps: FormWindowProps;
    handleDelete: (entry: CardEntry) => void;
}
export default function ModifyDropdown({
                                               entry,
                                               trigger,
                                               updateFormProps,
                                               handleDelete,
}: ModifyDropdownProps) {
    const [updateFormOpen, setUpdateFormOpen] = useState(false)

    return (
        <Dialog open={updateFormOpen} onOpenChange={setUpdateFormOpen}>
            <AlertDialog>
                {/*Dropdown with options*/}
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

                {/*Delete dialog*/}
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDelete(entry)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/*Update dialog*/}
            <DialogContent className={"sm:max-w-sm"}>
                <FormWindow
                    header={DEFAULT_UPDATE_FORM_HEADERS[updateFormProps.formType]}
                    {...updateFormProps}
                    baseItem={entry.item}
                    onCancel={() => {
                        // Closes update form on cancel
                        if (updateFormProps.onCancel) {
                            updateFormProps.onCancel()
                        }
                        setUpdateFormOpen(false)
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}