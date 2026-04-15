// Dropdown used for cards to modify data, shown using "trigger" element
// Includes Update option to update using form with pre-filled in data
// Includes Delete option to delete

import type { CardEntry } from "@/components/cards/Card.tsx";
import * as React from "react";
import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/dialog/Dialog.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/dialog/AlertDialog.tsx";
import { PencilIcon, TrashIcon } from "@phosphor-icons/react";
import type { FormState } from "@/components/forms/Form.tsx";
import { FormOfType, type FormType, type FormOfTypeProps } from "@/components/forms/FormOfType.tsx";

const DEFAULT_UPDATE_FORM_HEADERS: { [P in FormType]: string } = {
    Document: "Update Document",
    Employee: "Update Employee",
};

/** When set (documents), Edit checks out on open and checks in when the update dialog closes. */
export type DocumentCheckoutOptions = {
    /** True if the document is checked out by anyone (including this user in another tab). */
    checkoutBlocksActions: boolean;
    onCheckout: () => Promise<boolean>;
    onRelease: () => void;
};

type ModifyDropdownProps = {
    entry: CardEntry;
    trigger: React.ReactNode;
    handleDelete: (entry: CardEntry) => void;
    extraMenuItems?: React.ReactNode;
    documentCheckout?: DocumentCheckoutOptions;
    editError?: string;
    deleteError?: string;
} & FormOfTypeProps;

export default function ModifyDropdown({
                                           entry,
                                           trigger,
                                           handleDelete,
                                           extraMenuItems,
                                           formType,
                                           documentCheckout,
                                           editError,
                                           deleteError,
                                           ...state
}: ModifyDropdownProps) {
    const [updateFormOpen, setUpdateFormOpen] = useState(false);
    const needsCheckinRef = useRef(false);

    function releaseCheckoutIfHeld() {
        if (documentCheckout && needsCheckinRef.current) {
            needsCheckinRef.current = false;
            documentCheckout.onRelease();
        }
    }

    const formState: FormState = {
        ...state,
        baseItem: entry.item,
        noFixedHeight: true,
        onCancel: () => {
            if (documentCheckout && needsCheckinRef.current) {
                needsCheckinRef.current = false;
                documentCheckout.onRelease();
            } else if (state.onCancel) {
                state.onCancel();
            }
            setUpdateFormOpen(false);
        },
    };

    function handleDialogOpenChange(open: boolean) {
        if (!open) {
            releaseCheckoutIfHeld();
        }
        setUpdateFormOpen(open);
    }

    async function handleDocumentEditSelect(e: Event) {
        // e.preventDefault();
        if (!documentCheckout || documentCheckout.checkoutBlocksActions) return;
        const ok = await documentCheckout.onCheckout();
        if (ok) {
            needsCheckinRef.current = true;
            setUpdateFormOpen(true);
        }
    }

    const editElement = editError == null && (
        <DropdownMenuItem
            disabled={documentCheckout?.checkoutBlocksActions}
            title={
                documentCheckout?.checkoutBlocksActions
                    ? "This document is checked out. Finish editing in the other tab or wait until it is checked back in."
                    : undefined
            }
            onSelect={
                documentCheckout
                    ? (e) => {
                        void handleDocumentEditSelect(e)
                    }
                    : undefined
            }
        >
            <PencilIcon />
            Edit
        </DropdownMenuItem>
    )

    const deleteElement = deleteError == null && (
        <DropdownMenuItem
            variant="destructive"
            disabled={documentCheckout?.checkoutBlocksActions }
            title={
                documentCheckout?.checkoutBlocksActions
                    ? "Cannot delete while the document is checked out."
                    : undefined
            }
            onSelect={
                documentCheckout?.checkoutBlocksActions
                    ? (e) => e.preventDefault()
                    : undefined
            }
        >
            <TrashIcon />
            Delete
        </DropdownMenuItem>
    )

    return (
        <Dialog open={updateFormOpen} onOpenChange={handleDialogOpenChange}>
            <AlertDialog>
                {/*Dropdown with options*/}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {editElement && (
                            <DropdownMenuGroup>
                                {/*{documentCheckout ? editElement : (*/}
                                    <DialogTrigger asChild>
                                        {editElement}
                                    </DialogTrigger>
                                {/*)}*/}
                            </DropdownMenuGroup>
                        )}
                        {extraMenuItems && (
                            <DropdownMenuGroup>
                                {extraMenuItems}
                            </DropdownMenuGroup>
                        )}
                        {deleteElement && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <AlertDialogTrigger asChild>
                                        {deleteElement}
                                    </AlertDialogTrigger>
                                </DropdownMenuGroup>
                            </>
                        )}
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
                <FormOfType formType={formType} {...formState} />
            </DialogContent>
        </Dialog>
    );
}
