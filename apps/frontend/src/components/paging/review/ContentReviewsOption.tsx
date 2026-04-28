import {DropdownMenuItem} from "@/components/DropdownMenu.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { ContentReviewsProps } from "./ContentReviews";
import ContentReviews from "./ContentReviews";

type ContentReviewOptionProps = ContentReviewsProps
export default function ContentReviewsOption(props: ContentReviewOptionProps) {
    const [detailsOpen, setDetailsOpen] = useState(false);

    return (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                    }}
                >
                    <CalendarBlankIcon/>
                    Reviews
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent
                className={
                    "max-w-[calc(100%-1.5rem)] min-w-0 p-5 text-sm gap-4 sm:w-[25%] sm:max-w-[calc(100%-1.5rem)] sm:min-w-[30%] sm:p-6 sm:pr-10 sm:text-base max-h-[min(90dvh,720px)] overflow-y-auto overflow-x-hidden"
                }
            >
                <DialogHeader className="gap-1.5 pb-0 sm:gap-2 sm:pb-1">
                    <DialogTitle className="text-base font-semibold sm:text-lg">
                        Upcoming Reviews
                    </DialogTitle>
                </DialogHeader>
                <ContentReviews {...props}/>
            </DialogContent>
        </Dialog>
    )
}