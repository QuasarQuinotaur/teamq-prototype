import {
    DropdownMenuCheckboxItem,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger
} from "@/components/DropdownMenu.tsx";
import {PencilIcon, PlusIcon, TagIcon, TrashIcon} from "@phosphor-icons/react";
import * as React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {useEffect, useMemo, useState} from "react";
import type {Tag} from "db";
import {ScrollArea} from "@/elements/scroll-area.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import TagFormDialog from "@/components/paging/tags/TagFormDialog.tsx";
import {TableBody, TableRow} from "@/components/Table.tsx";
import DeleteConfirmDialog from "@/components/dialog/DeleteConfirmDialog.tsx";
import TagElement from "@/components/paging/tags/TagElement.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";

export type TagsOptionProps = {
    contentId: number;
    tagIds: number[];
    tagList: Tag[];
    /** Called when this content's tags are updated */
    contentTagsUpdated?: () => void;
    /** Called when the list of all tags is modified (added/removed/changed tags) */
    tagsModified?: () => void;
}
export default function TagsOption({
                                       contentId,
                                       tagIds,
                                       tagList,
                                       contentTagsUpdated,
                                       tagsModified
}: TagsOptionProps) {
    // console.log("TAG OPTION:", contentId, tagList, tagIds)
    const [modifyTagsOpen, setModifyTagsOpen] = useState(false)
    const hasTags = tagList.length > 0

    const appliedTagIdMap = useMemo(() => {
        return tagList.reduce((map, tag) => {
            map[tag.id] = tagIds.includes(tag.id)
            return map
        }, {} as {[key: number]: boolean})
    }, [tagList, tagIds])

    useEffect(() => {
        if (tagList.length === 0) {
            setModifyTagsOpen(false)
        }
    }, [tagList]);

    function isApplied(tagId: number): boolean {
        return appliedTagIdMap[tagId]
    }

    async function toggleTagId(tagId: number, applyTag: boolean) {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${contentId}/tags/${tagId}`, {
            method: applyTag ? "POST" : "DELETE",
            credentials: "include",
        })
            .finally(() => {
                if (contentTagsUpdated) {
                    contentTagsUpdated()
                }
            });
    }

    async function deleteByTagId(tagId: number) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tags/${tagId}`, {
            method: "DELETE",
            credentials: "include",
        })
        if (tagsModified) {
            tagsModified()
        }
    }

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <TagIcon/>
                Tags
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                <ScrollArea className={"min-h-0 max-h-70"}>
                    {!hasTags ? <DropdownMenuLabel>No tags found.</DropdownMenuLabel> : (
                        tagList.map(tag => {
                            const tagApplied = isApplied(tag.id)
                            return (
                                <DropdownMenuCheckboxItem
                                    checked={tagApplied}
                                    onCheckedChange={(newApplied) => {
                                        void toggleTagId(tag.id, newApplied)
                                    }}
                                    onSelect={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <TagElement
                                        tag={tag}
                                        tagFilled={tagApplied}
                                    />
                                </DropdownMenuCheckboxItem>
                            )
                        })
                    )}
                </ScrollArea>

                <div className={"sticky"}>
                    <DropdownMenuSeparator/>

                    {/*Create Tag option*/}
                    <TagFormDialog
                        header={"Create Tag"}
                        onSubmitted={() => tagsModified && tagsModified()}
                    >
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                            }}
                        >
                            <PlusIcon/>
                            Create new tag
                        </DropdownMenuItem>
                    </TagFormDialog>

                    {/*Modify Tags option*/}
                    {hasTags && (
                        <Dialog open={modifyTagsOpen} onOpenChange={setModifyTagsOpen}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <PencilIcon/>
                                    Modify tags
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent
                                className={`w-fit min-w-70 max-w-[90vw] sm:max-w-150 sm:min-w-90 p-5 text-sm gap-4
                                 sm:p-6 sm:pr-10 sm:text-base max-h-[min(90dvh,720px)] overflow-y-auto overflow-x-hidden`}
                            >
                                <DialogHeader className="gap-1.5 pb-0 sm:gap-2 sm:pb-1">
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="m-0 border-b-0 pb-0 text-base font-semibold leading-none sm:text-lg sm:leading-none">
                                            Modify Tags
                                        </DialogTitle>
                                        <HelpHint contentClassName="max-w-sm">
                                            Edit or delete tags from the library. Deleting a tag removes it from all
                                            documents that use it.
                                        </HelpHint>
                                    </div>
                                </DialogHeader>
                                <ScrollArea className={"min-h-0 max-h-120"}>
                                    <TableBody className={"flex flex-col gap-1 pr-3"}>
                                        {tagList.map(tag => (
                                            <TableRow className={"w-full justify-between text-base p-1 pl-2 flex flex-nowrap items-center  hover:bg-background"}>
                                                <TagElement
                                                    tag={tag}
                                                />
                                                <div className={"justify-self-end flex gap-1"}>
                                                    <TagFormDialog
                                                        header={"Edit Tag"}
                                                        onSubmitted={() => tagsModified && tagsModified()}
                                                        baseItem={tag}
                                                    >
                                                        <Button variant={"outline"}>
                                                            <PencilIcon/>
                                                        </Button>
                                                    </TagFormDialog>
                                                    <DeleteConfirmDialog
                                                        onDelete={() => void deleteByTagId(tag.id)}
                                                    >
                                                        <Button variant={"outline"}>
                                                            <TrashIcon color={"var(--destructive)"}/>
                                                        </Button>
                                                    </DeleteConfirmDialog>
                                                </div>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    )
}