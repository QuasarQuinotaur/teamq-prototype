import DeleteConfirmDialog from "@/components/dialog/DeleteConfirmDialog";
import { DialogHeader } from "@/components/dialog/Dialog";
import { TableBody, TableRow } from "@/components/Table";
import { Button } from "@/elements/buttons/button";
import { ScrollArea } from "@/elements/scroll-area";
import { Separator } from "@/elements/separator";
import { cn, formatDate } from "@/lib/utils";
import { PencilIcon, TrashIcon } from "@phosphor-icons/react";
import type { ContentReview } from "db";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import ReviewFormDialog from "./ReviewFormDialog";


export type ContentReviewsProps = {
    contentId: number
}
export default function ContentReviews({
    contentId
}: ContentReviewsProps) {
    const [reviewList, setReviewList] = useState<ContentReview[]>([])

    useEffect(() => {
        const fetchReviewList = async () => {
            try {
                console.log("REVIEWS PRE:", contentId)
                const reviewsResponse = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/reviews/content/${contentId}`,
                    {credentials: "include"}
                );
                const reviews = await reviewsResponse.json();
                console.log("PRE ERROR REVIEWS:", reviews)
                if (!reviewsResponse.ok) {
                    throw new Error(reviews.error ?? "Failed to fetch review dates")
                }
                console.log("PASSED ERROR REVIEWS:", reviews)
                setReviewList(reviews)
            } catch (error) {
                console.error(error)
            }
        }
        void fetchReviewList();
    }, [])



    function onReviewsModified() {
        // refetchRoles()
        console.log("REVIEWS MODIFIED")
    }

    return (
        <div>
            <div className="flex flex-col gap-3">
                <ScrollArea className={"min-h-0 max-h-120"}>
                    <TableBody className={"flex flex-col gap-1 pr-3"}>
                        {reviewList.length === 0 ? (
                            <p>No review dates found.</p>
                        ) : reviewList.map(review => {
                            const reviewDate: Date = review.date
                            return (
                                <TableRow className={"w-full justify-between text-base p-1 pl-2 flex flex-nowrap items-center  hover:bg-background"}>
                                    <div>
                                        {/* For now we just show the review date */}
                                        {formatDate(reviewDate)}
                                    </div>
                                    <div className={"justify-self-end flex gap-1"}>
                                        <Button variant={"outline"}>
                                            <PencilIcon/>
                                        </Button>
                                        <ReviewFormDialog
                                            header={"Edit Review Date"}
                                            onSubmitted={onReviewsModified}
                                            baseItem={review}
                                        >
                                            <Button
                                                className={
                                                    "mt-2 w-fit px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                                }
                                            >
                                                <PlusIcon />
                                                New Review Date
                                            </Button>
                                        </ReviewFormDialog>
                                        <DeleteConfirmDialog
                                            onDelete={() => {}}
                                        >
                                            <Button variant={"outline"}>
                                                <TrashIcon color={"var(--destructive)"}/>
                                            </Button>
                                        </DeleteConfirmDialog>
                                    </div>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </ScrollArea>
                <ReviewFormDialog
                    header={"Create Review"}
                    onSubmitted={onReviewsModified}
                >
                    <Button
                        className={
                            "mt-2 w-fit px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        }
                    >
                        <PlusIcon />
                        New Review
                    </Button>
                </ReviewFormDialog>
            </div>
        </div>
    )
}