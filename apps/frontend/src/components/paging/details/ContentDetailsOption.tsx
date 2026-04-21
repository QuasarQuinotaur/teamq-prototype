import {DropdownMenuItem} from "@/components/DropdownMenu.tsx";
import {InfoIcon} from "@phosphor-icons/react";
import * as React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {useState} from "react";
import ContentDetails, {type ContentDetailsProps} from "@/components/paging/details/ContentDetails.tsx";

export type ContentDetailsOptionProps = ContentDetailsProps
export default function ContentDetailsOption(props: ContentDetailsOptionProps) {
    const [detailsOpen, setDetailsOpen] = useState(false);

    return (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                    }}
                >
                    <InfoIcon/>
                    Details
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent
                className={
                    "max-w-[calc(100%-1.5rem)] min-w-0 p-5 text-sm gap-4 sm:w-[20%] sm:max-w-[calc(100%-1.5rem)] sm:min-w-[25%] sm:p-6 sm:pr-10 sm:text-base max-h-[min(90dvh,720px)] overflow-y-auto overflow-x-hidden"
                }
            >
                <DialogHeader className="gap-1.5 pb-0 sm:gap-2 sm:pb-1">
                    <DialogTitle className="text-base font-semibold sm:text-lg">
                        Content Details
                    </DialogTitle>
                </DialogHeader>
                <ContentDetails {...props}/>
            </DialogContent>
        </Dialog>
    )
}