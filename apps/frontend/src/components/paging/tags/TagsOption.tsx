import {
    DropdownMenuCheckboxItem,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger
} from "@/components/DropdownMenu.tsx";
import {Globe, PencilIcon, PlusIcon, SparkleIcon, TagIcon, TrashIcon} from "@phosphor-icons/react";
import * as React from "react";
import {Loader2Icon} from "lucide-react";
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

const SUGGEST_TAGS_FETCH_TIMEOUT_MS = 200_000;

function isAiTagEligibleFile(filePath: string | null | undefined): boolean {
    if (!filePath?.trim()) {
        return false;
    }
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return false;
    }
    return true;
}

export type TagsOptionProps = {
    contentId: number;
    /** Storage path for uploads; omit or use external URL to disable AI tag suggestions in the menu. */
    filePath?: string | null;
    tagIds: number[];
    tagList: Tag[];
    isAdmin: boolean;
    /**
     * Apply tag add/remove to local list state immediately (before the API returns).
     * When omitted, successful toggles still use {@link contentTagsUpdated} after the request.
     */
    onOptimisticTagChange?: (tagId: number, apply: boolean) => void;
    /** Called when this content's tags are updated */
    contentTagsUpdated?: () => void;
    /** Called when the list of all tags is modified (added/removed/changed tags) */
    tagsModified?: () => void;
}
export default function TagsOption({
                                       contentId,
                                       filePath,
                                       tagIds,
                                       tagList,
                                       isAdmin,
                                       onOptimisticTagChange,
                                       contentTagsUpdated,
                                       tagsModified
}: TagsOptionProps) {
    // console.log("TAG OPTION:", contentId, tagList, tagIds)
    const [modifyTagsOpen, setModifyTagsOpen] = useState(false)
    const [suggestTagsLoading, setSuggestTagsLoading] = useState(false)
    const [suggestErrorOpen, setSuggestErrorOpen] = useState(false)
    const [suggestErrorMessage, setSuggestErrorMessage] = useState("")
    /** `null` = no run yet; `[]` = ran, nothing new; otherwise AI-suggested tag ids for this document. */
    const [aiSuggestedTagIds, setAiSuggestedTagIds] = useState<number[] | null>(null)
    const [selectAllAiLoading, setSelectAllAiLoading] = useState(false)
    const hasTags = tagList.length > 0
    const canSuggestTagsWithAi = hasTags && isAiTagEligibleFile(filePath)

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

    useEffect(() => {
        setAiSuggestedTagIds(null)
    }, [contentId]);

    function isApplied(tagId: number): boolean {
        return appliedTagIdMap[tagId]
    }

    async function toggleTagId(tagId: number, applyTag: boolean) {
        onOptimisticTagChange?.(tagId, applyTag);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/content/${contentId}/tags/${tagId}`,
                {
                    method: applyTag ? "POST" : "DELETE",
                    credentials: "include",
                },
            );
            const ok = res.ok || (applyTag && res.status === 409);
            if (!ok) {
                contentTagsUpdated?.();
                return;
            }
            if (!onOptimisticTagChange) {
                contentTagsUpdated?.();
            }
        } catch {
            contentTagsUpdated?.();
        }
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

    function openSuggestError(message: string) {
        setSuggestErrorMessage(message)
        setSuggestErrorOpen(true)
    }

    async function runSuggestTagsWithAi() {
        if (!canSuggestTagsWithAi || suggestTagsLoading) {
            return;
        }
        setSuggestTagsLoading(true);
        setAiSuggestedTagIds(null);
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), SUGGEST_TAGS_FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/content/${contentId}/suggest-tags`,
                {
                    method: "POST",
                    credentials: "include",
                    signal: controller.signal,
                },
            );
            const body: unknown = await res.json().catch(() => null);
            const errMsg =
                typeof body === "object" &&
                body !== null &&
                "error" in body &&
                typeof (body as { error: unknown }).error === "string"
                    ? (body as { error: string }).error
                    : null;
            if (!res.ok) {
                openSuggestError(errMsg || `Could not suggest tags (${res.status}).`);
                return;
            }
            const rawIds =
                typeof body === "object" &&
                body !== null &&
                "tagIds" in body &&
                Array.isArray((body as { tagIds: unknown }).tagIds)
                    ? (body as { tagIds: unknown[] }).tagIds.filter(
                          (x): x is number =>
                              typeof x === "number" && Number.isInteger(x),
                      )
                    : [];
            const allowed = new Set(tagList.map((t) => t.id))
            const nextIds = rawIds.filter((id) => allowed.has(id))
            setAiSuggestedTagIds(nextIds)
        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
                openSuggestError("Tag suggestion timed out. Try again.");
            } else {
                openSuggestError(
                    e instanceof Error ? e.message : "Tag suggestion failed.",
                );
            }
        } finally {
            window.clearTimeout(timeoutId);
            setSuggestTagsLoading(false);
        }
    }

    const aiSuggestedTagsInMenu = useMemo(() => {
        if (!aiSuggestedTagIds?.length) {
            return []
        }
        const set = new Set(aiSuggestedTagIds)
        return tagList.filter((t) => set.has(t.id))
    }, [tagList, aiSuggestedTagIds])

    /** Tags listed only in the AI section while suggestions are shown, so each tag appears once. */
    const mainMenuTagList = useMemo(() => {
        if (aiSuggestedTagIds === null || aiSuggestedTagIds.length === 0) {
            return tagList
        }
        const hidden = new Set(aiSuggestedTagIds)
        return tagList.filter((t) => !hidden.has(t.id))
    }, [tagList, aiSuggestedTagIds])

    async function selectAllAiSuggestedTags() {
        if (!aiSuggestedTagIds?.length || selectAllAiLoading) {
            return
        }
        const toAdd = aiSuggestedTagIds.filter((id) => !tagIds.includes(id))
        if (toAdd.length === 0) {
            return
        }
        setSelectAllAiLoading(true)
        for (const tagId of toAdd) {
            onOptimisticTagChange?.(tagId, true)
        }
        try {
            const results = await Promise.all(
                toAdd.map((tagId) =>
                    fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/content/${contentId}/tags/${tagId}`,
                        {
                            method: "POST",
                            credentials: "include",
                        },
                    ),
                ),
            )
            const failed = results.find((r) => !r.ok && r.status !== 409)
            if (failed) {
                openSuggestError(
                    `Could not add all tags (${failed.status}). Try again.`,
                )
                contentTagsUpdated?.()
                return
            }
            if (!onOptimisticTagChange) {
                contentTagsUpdated?.()
            }
        } catch {
            openSuggestError("Failed to add tags. Try again.")
            contentTagsUpdated?.()
        } finally {
            setSelectAllAiLoading(false)
        }
    }

    return (
        <>
        <DropdownMenuSub
            onOpenChange={(open) => {
                if (!open) {
                    setAiSuggestedTagIds(null)
                }
            }}
        >
            <DropdownMenuSubTrigger>
                <TagIcon/>
                Tags
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                <ScrollArea className={"min-h-0 max-h-70"}>
                    {!hasTags ? <DropdownMenuLabel>No tags found.</DropdownMenuLabel> : (
                        mainMenuTagList.map(tag => {
                            const tagApplied = isApplied(tag.id)
                            return (
                                <DropdownMenuCheckboxItem
                                    key={tag.id}
                                    checked={tagApplied}
                                    className={tag.isGlobal ? "pr-12" : undefined}
                                    onCheckedChange={(newApplied) => {
                                        void toggleTagId(tag.id, newApplied)
                                    }}
                                    onSelect={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <div className="flex w-full min-w-0 items-center gap-1.5">
                                        <div className="min-w-0 flex-1">
                                            <TagElement
                                                tag={tag}
                                                tagFilled={tagApplied}
                                                showGlobalIcon={false}
                                            />
                                        </div>
                                        {tag.isGlobal && (
                                            <span
                                                title="Global tag (visible to everyone)"
                                                className="ml-auto flex shrink-0 text-muted-foreground"
                                                aria-label="Global tag"
                                            >
                                                <Globe className="size-4" weight="duotone" />
                                            </span>
                                        )}
                                    </div>
                                </DropdownMenuCheckboxItem>
                            )
                        })
                    )}
                </ScrollArea>

                <div className={"sticky"}>
                    <DropdownMenuSeparator/>

                    {suggestTagsLoading || aiSuggestedTagIds === null ? (
                        <DropdownMenuItem
                            disabled={!canSuggestTagsWithAi || suggestTagsLoading}
                            title={
                                !hasTags
                                    ? "Create tags first"
                                    : !isAiTagEligibleFile(filePath)
                                      ? "Only available for uploaded files"
                                      : undefined
                            }
                            onSelect={(e) => {
                                e.preventDefault();
                                void runSuggestTagsWithAi();
                            }}
                        >
                            {suggestTagsLoading ? (
                                <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                                <SparkleIcon />
                            )}
                            Suggest tags with AI
                        </DropdownMenuItem>
                    ) : (
                        <div
                            className="pointer-events-none relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-popover-foreground select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                        >
                            <SparkleIcon />
                            Suggested tags:
                        </div>
                    )}

                    {aiSuggestedTagIds !== null && !suggestTagsLoading && (
                        <>
                            {aiSuggestedTagIds.length === 0 ? (
                                <DropdownMenuLabel className="font-normal text-muted-foreground">
                                    No new tag suggestions
                                </DropdownMenuLabel>
                            ) : (
                                <>
                                    <DropdownMenuSeparator />
                                    {aiSuggestedTagsInMenu.map((tag) => {
                                        const tagApplied = isApplied(tag.id)
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={`ai-suggest-${tag.id}`}
                                                checked={tagApplied}
                                                className={tag.isGlobal ? "pr-12" : undefined}
                                                onCheckedChange={(newApplied) => {
                                                    void toggleTagId(tag.id, newApplied)
                                                }}
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                }}
                                            >
                                                <div className="flex w-full min-w-0 items-center gap-1.5">
                                                    <div className="min-w-0 flex-1">
                                                        <TagElement
                                                            tag={tag}
                                                            tagFilled={tagApplied}
                                                            showGlobalIcon={false}
                                                        />
                                                    </div>
                                                    {tag.isGlobal && (
                                                        <span
                                                            title="Global tag (visible to everyone)"
                                                            className="ml-auto flex shrink-0 text-muted-foreground"
                                                            aria-label="Global tag"
                                                        >
                                                            <Globe className="size-4" weight="duotone" />
                                                        </span>
                                                    )}
                                                </div>
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                                    <DropdownMenuItem
                                        disabled={
                                            selectAllAiLoading ||
                                            aiSuggestedTagIds.every((id) =>
                                                tagIds.includes(id),
                                            )
                                        }
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            void selectAllAiSuggestedTags();
                                        }}
                                    >
                                        {selectAllAiLoading ? (
                                            <Loader2Icon className="size-4 animate-spin" />
                                        ) : null}
                                        Select all
                                    </DropdownMenuItem>
                                </>
                            )}
                        </>
                    )}

                    {/*Create Tag option*/}
                    <TagFormDialog
                        header={"Create Tag"}
                        onSubmitted={() => tagsModified && tagsModified()}
                        isAdmin={isAdmin}
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
                                            <TableRow key={tag.id} className={"w-full justify-between text-base p-1 pl-2 flex flex-nowrap items-center  hover:bg-background"}>
                                                <TagElement
                                                    tag={tag}
                                                />
                                                {(!tag.isGlobal || isAdmin) && (
                                                <div className={"justify-self-end flex gap-1"}>
                                                    <TagFormDialog
                                                        header={"Edit Tag"}
                                                        onSubmitted={() => tagsModified && tagsModified()}
                                                        baseItem={tag}
                                                        isAdmin={isAdmin}
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
                                                )}
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

        <Dialog
            open={suggestErrorOpen}
            onOpenChange={(open) => {
                setSuggestErrorOpen(open)
                if (!open) {
                    setSuggestErrorMessage("")
                }
            }}
        >
            <DialogContent
                className="sm:max-w-md"
                showCloseButton={true}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">
                        Tag suggestion
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">{suggestErrorMessage}</p>
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="default"
                        onClick={() => setSuggestErrorOpen(false)}
                    >
                        OK
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}