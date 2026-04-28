import DeleteConfirmDialog from "@/components/dialog/DeleteConfirmDialog";
import { DialogHeader } from "@/components/dialog/Dialog";
import { TableBody, TableRow } from "@/components/Table";
import { Button } from "@/elements/buttons/button";
import { ScrollArea } from "@/elements/scroll-area";
import { Separator } from "@/elements/separator";
import { cn, formatDate } from "@/lib/utils";
import { PencilIcon, TrashIcon } from "@phosphor-icons/react";
import type { Content, ContentReview } from "db";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import ReviewFormDialog from "./ReviewFormDialog";
import { Label } from "@/elements/label";


export type ContentReviewsProps = {
    content: Content,
    contentReviewsUpdated?: () => void
}
export default function ContentReviews({
    content,
    contentReviewsUpdated
}: ContentReviewsProps) {
    const [reviewList, setReviewList] = useState<ContentReview[]>([])
    const [updateReviewList, setUpdateReviewList] = useState(true)
    const contentId = content.id

    useEffect(() => {
        const fetchReviewList = async () => {
            try {
                if (!updateReviewList) {
                    return
                }
                const reviewsResponse = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/reviews/content/${contentId}`,
                    {credentials: "include"}
                );
                const reviews = await reviewsResponse.json();
                if (!reviewsResponse.ok) {
                    throw new Error(reviews.error ?? "Failed to fetch review dates")
                }
                setReviewList(reviews)
                setUpdateReviewList(false)
            } catch (error) {
                console.error(error)
            }
        }
        void fetchReviewList();
    }, [updateReviewList])


    function onReviewsModified() {
        setUpdateReviewList(true)
        if (contentReviewsUpdated) {
            contentReviewsUpdated();
        }
    }


    async function deleteByReviewId(reviewId: number) {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${reviewId}`, {
            method: "DELETE",
            credentials: "include",
        })
        const result = await response.json()
        if (result && result.success) {
            onReviewsModified()
        } else {
            throw new Error(result ? result.error : `Failed to delete review`)
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <ScrollArea className={"min-h-0 max-h-120"}>
                <TableBody className={"flex flex-col gap-1 pr-3"}>
                    {reviewList.length === 0 ? (
                        <p>No review dates found.</p>
                    ) : reviewList.sort((a, b) => {
                        return new Date(a.date).toLocaleDateString().localeCompare(new Date(b.date).toLocaleDateString())
                    }).map((review, index) => {
                        const reviewDate: Date = new Date(review.date)
                        return (
                            <TableRow className={"w-full justify-between text-base p-1 pl-2 flex flex-nowrap items-center  hover:bg-background"}>
                                <div className="flex flex-col gap-3 pt-2 pb-2">
                                    {/* For now we just show the review date */}
                                    <Label>
                                        <b>{index + 1}. {review.stepName}</b>
                                    </Label>
                                    <Label>
                                    {formatDate(reviewDate)}
                                    </Label>
                                </div>
                                <div className={"justify-self-end flex gap-1"}>
                                    <ReviewFormDialog
                                        contentId={contentId}
                                        header={"Edit Review Date"}
                                        onSubmitted={onReviewsModified}
                                        baseItem={review}
                                    >
                                        <Button variant={"outline"}>
                                            <PencilIcon/>
                                        </Button>
                                    </ReviewFormDialog>
                                    <DeleteConfirmDialog
                                        onDelete={() => void deleteByReviewId(review.id)}
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
                contentId={contentId}
                header={"Create Review"}
                onSubmitted={onReviewsModified}
            >
                <Button
                    className={
                        "mt-2 w-full px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    }
                >
                    <PlusIcon />
                    New Review
                </Button>
            </ReviewFormDialog>
        </div>
    )
}