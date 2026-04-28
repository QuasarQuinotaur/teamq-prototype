// Dropdown used for cards to modify data, shown using "trigger" element
// Includes Update option to update using form with pre-filled in data
// Includes Delete option to delete

import type { CardEntry } from "@/components/cards/Card.tsx";
import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/dialog/Dialog.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";
import { LockKeyIcon, LockKeyOpenIcon, PencilIcon, TrashIcon } from "@phosphor-icons/react";
import type { FormState } from "@/components/forms/Form.tsx";
import { FormOfType, type FormType, type FormOfTypeProps } from "@/components/forms/FormOfType.tsx";
import DeleteConfirmDialog from "@/components/dialog/DeleteConfirmDialog.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";

const DEFAULT_UPDATE_FORM_HEADERS: { [P in FormType]: string } = {
    Document: "Update Document",
    Employee: "Update Employee",
};

const UPDATE_FORM_HELP: { [P in FormType]: React.ReactNode } = {
    Document:
        "Edit this document’s metadata and file. For checked-out documents, you must hold the checkout lock to save changes.",
    Employee: "Update this employee’s profile. Save applies changes to the directory.",
};

/** Document lock: checkout/check in from the menu; Edit/Delete only while you hold the lock (`heldByMe`). */
export type DocumentCheckoutOptions = {
    checkedOutByOther: boolean;
    heldByMe: boolean;
    canAttemptCheckout: boolean;
    onCheckout: () => Promise<boolean>;
    onCheckin: () => void;
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

    const formState: FormState = {
        ...state,
        baseItem: entry.item,
        noFixedHeight: true,
        onCancel: () => {
            if (state.onCancel) {
                state.onCancel();
            }
            setUpdateFormOpen(false);
        },
    };

    function handleDialogOpenChange(open: boolean) {
        setUpdateFormOpen(open);
    }

    const showEdit =
        editError == null &&
        (!documentCheckout || documentCheckout.heldByMe);

    const showDelete =
        deleteError == null &&
        (!documentCheckout || documentCheckout.heldByMe);

    const checkoutBody =
        documentCheckout == null
            ? null
            : documentCheckout.heldByMe ? (
                  <DropdownMenuItem
                      onSelect={() => {
                          documentCheckout.onCheckin();
                      }}
                  >
                      <LockKeyIcon className="h-4 w-4" />
                      Check in
                  </DropdownMenuItem>
              )
            : documentCheckout.canAttemptCheckout ? (
                  <DropdownMenuItem
                      disabled={documentCheckout.checkedOutByOther}
                      title={
                          documentCheckout.checkedOutByOther
                              ? "This document is checked out by someone else."
                              : undefined
                      }
                      onSelect={() => {
                          void documentCheckout.onCheckout();
                      }}
                  >
                      <LockKeyOpenIcon className="h-4 w-4" />
                      Check out
                  </DropdownMenuItem>
              )
            : null;

    const checkoutGroup =
        checkoutBody != null ? <DropdownMenuGroup>{checkoutBody}</DropdownMenuGroup> : null;

    const showEditOrDeleteBlock = showEdit || showDelete;
    const showCheckoutSeparator =
        checkoutGroup != null && (showEditOrDeleteBlock || extraMenuItems != null);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {checkoutGroup}
                {showCheckoutSeparator ? <DropdownMenuSeparator /> : null}
                {showEdit && (
                    <DropdownMenuGroup>
                        <Dialog open={updateFormOpen} onOpenChange={handleDialogOpenChange}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <PencilIcon />
                                    Edit
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent
                                className={
                                    "w-full max-w-[calc(100%-1.5rem)] min-w-0 p-5 text-sm gap-4 sm:max-w-xl sm:p-6 sm:text-base max-h-[min(90dvh,720px)] overflow-y-auto overflow-x-hidden"
                                }
                            >
                                <DialogHeader className="gap-1.5 pb-0 sm:gap-2 sm:pb-1">
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="m-0 border-b-0 pb-0 text-base font-semibold leading-none sm:text-lg sm:leading-none">
                                            {DEFAULT_UPDATE_FORM_HEADERS[formType]}
                                        </DialogTitle>
                                        <HelpHint contentClassName="max-w-sm">
                                            {UPDATE_FORM_HELP[formType]}
                                        </HelpHint>
                                    </div>
                                </DialogHeader>
                                <FormOfType formType={formType} {...formState} />
                            </DialogContent>
                        </Dialog>
                    </DropdownMenuGroup>
                )}
                {extraMenuItems && (
                    <DropdownMenuGroup>{extraMenuItems}</DropdownMenuGroup>
                )}
                {showDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DeleteConfirmDialog
                                onDelete={() => handleDelete(entry)}
                            >
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <TrashIcon />
                                    Delete
                                </DropdownMenuItem>
                            </DeleteConfirmDialog>
                        </DropdownMenuGroup>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
