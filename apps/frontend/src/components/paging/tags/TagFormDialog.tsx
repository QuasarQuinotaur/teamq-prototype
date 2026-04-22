import * as React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {DropdownMenuItem} from "@/components/DropdownMenu.tsx";
import {PlusIcon} from "@phosphor-icons/react";
import TagForm, {type TagFormProps} from "@/components/forms/TagForm.tsx";
import {useState} from "react";

type TagFormDialogProps = {
    header: string,
    children: React.ReactNode,
} & TagFormProps
export default function TagFormDialog({
                                          header,
                                          children,
                                           ...props
}: TagFormDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                className={
                    "max-w-[calc(100%-1.5rem)] min-w-0 p-5 text-sm gap-4 sm:max-w-fit sm:min-w-[25%] sm:p-6 sm:pr-10 sm:text-base max-h-[min(90dvh,720px)] overflow-y-auto overflow-x-hidden"
                }
            >
                <DialogHeader className="gap-1.5 pb-0 sm:gap-2 sm:pb-1">
                    <DialogTitle className="text-base font-semibold sm:text-lg">
                        {header}
                    </DialogTitle>
                </DialogHeader>
                <TagForm
                    {...props}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}