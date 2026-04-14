// Dropdown used for cards to modify data, shown using "trigger" element
// Includes Update option to update using form with pre-filled in data
// Includes Delete option to delete

import type {CardEntry} from "@/components/cards/Card.tsx";
import * as React from "react";
import {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/dialog/Dialog.tsx";
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
import {PencilIcon, TrashIcon} from "@phosphor-icons/react";
import type {FormState} from "@/components/forms/Form.tsx";
import {
    FormOfType,
    type FormType,
    type FormOfTypeProps
} from "@/components/forms/FormOfType.tsx";


const DEFAULT_UPDATE_FORM_HEADERS: {[P in FormType]: string} = {
    Document: "Update Document",
    Employee: "Update Employee"
}

type ModifyDropdownProps = {
    entry: CardEntry;
    trigger: React.ReactNode;
    handleDelete: (entry: CardEntry) => void;
    extraMenuItems?: React.ReactNode;
} & FormOfTypeProps
export default function ModifyDropdown({
                                           entry,
                                           trigger,
                                           handleDelete,
                                           extraMenuItems,
                                           formType,
                                           ...state
}: ModifyDropdownProps) {
    const [updateFormOpen, setUpdateFormOpen] = useState(false)

    const formState: FormState = {
        ...state,
        baseItem: entry.item,
        noFixedHeight: true,
        onCancel: () => {
            // Closes update form on cancel
            setUpdateFormOpen(false)
            if (state.onCancel) {
                state.onCancel()
            }
        }
    }

    return (
        <Dialog open={updateFormOpen} onOpenChange={setUpdateFormOpen}>
            <AlertDialog>
                {/*Dropdown with options*/}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                            <DialogTrigger asChild>
                                <DropdownMenuItem>
                                    <PencilIcon/>
                                    Edit
                                </DropdownMenuItem>
                            </DialogTrigger>
                        </DropdownMenuGroup>
                        {extraMenuItems && (
                            <DropdownMenuGroup>
                                {extraMenuItems}
                            </DropdownMenuGroup>
                        )}
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
            <DialogContent
                className={
                    "w-full max-w-[calc(100%-1.5rem)] min-w-0 p-5 text-sm gap-4 sm:max-w-xl sm:p-6 sm:text-base max-h-[min(90dvh,720px)] overflow-y-auto overflow-x-hidden"
                }
            >
                <DialogHeader className="gap-1.5 pb-0 sm:gap-2 sm:pb-1">
                    <DialogTitle className="text-base font-semibold sm:text-lg">
                        {DEFAULT_UPDATE_FORM_HEADERS[formType]}
                    </DialogTitle>
                </DialogHeader>
                <FormOfType
                    formType={formType}
                    {...formState}
                />
            </DialogContent>
        </Dialog>
    )
}