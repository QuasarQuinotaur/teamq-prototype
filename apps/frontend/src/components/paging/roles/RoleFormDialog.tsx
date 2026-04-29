import * as React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {useState} from "react";
import RoleForm, { type RoleFormProps } from "@/components/forms/RoleForm";

type RoleFormDialogProps = {
    header: string,
    children: React.ReactNode,
} & RoleFormProps
export default function RoleFormDialog({
                                          header,
                                          children,
                                           ...props
}: RoleFormDialogProps) {
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
                <RoleForm
                    {...props}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}