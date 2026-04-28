import * as React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import TagForm, {type TagFormProps} from "@/components/forms/TagForm.tsx";
import {useState} from "react";
import { HelpHint } from "@/elements/help-hint.tsx";

function tagFormDialogHelp(header: string): React.ReactNode {
    switch (header) {
        case "Create Tag":
            return "Adds a new tag anyone can assign to documents. Submit creates it for the whole workspace.";
        case "Edit Tag":
            return "Change the tag’s appearance or name. Updates apply everywhere this tag is used.";
        default:
            return "Fill in the fields and submit to save.";
    }
}

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
                    <div className="flex items-center gap-2">
                        <DialogTitle className="m-0 border-b-0 pb-0 text-base font-semibold leading-none sm:text-lg sm:leading-none">
                            {header}
                        </DialogTitle>
                        <HelpHint contentClassName="max-w-sm">{tagFormDialogHelp(header)}</HelpHint>
                    </div>
                </DialogHeader>
                <TagForm
                    {...props}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}