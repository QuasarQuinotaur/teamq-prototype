import * as React from "react";
import ComboboxMapInput, {type ComboboxEntry, type ComboboxEntryProps} from "@/components/input/ComboboxMapInput.tsx";
import {type ComponentProps, useEffect, useMemo, useState} from "react";
import {ComboboxChipsInput} from "@/components/Combobox.tsx";
import {TagIcon} from "@phosphor-icons/react";
import type {Tag} from "db";
import TagElement from "@/components/paging/tags/TagElement.tsx";


type TagMultiInputProps = {
    tagList: Tag[];
    tagIds: number[];
    setTagIds: (tagIds: number[]) => void;
} & ComponentProps<typeof ComboboxChipsInput>
export default function TagMultiInput({
                                          tagList,
                                          tagIds,
                                          setTagIds,
                                          ...props
}: TagMultiInputProps) {
    const tagEntryMap: {[id: string]: ComboboxEntry} = useMemo(() => {
        return tagList.reduce((map, tag) => {
            map[String(tag.id)] = (props: ComboboxEntryProps) => (
                <TagElement
                    tag={tag}
                    tagFilled={props.isApplied}
                    noWrap={true}
                    addExtraPadding={!props.isChip}
                />
            )
            return map
        }, {})
    }, [tagList, tagIds]);

    return (
        <ComboboxMapInput
            map={tagEntryMap}
            values={tagIds.map(tagId => String(tagId))}
            setValues={(tagIds) => {
                setTagIds(tagIds.map(tagId => Number(tagId)))
            }}
            placeholder={"Tag"}
            emptyText={"No tags found."}
            {...props}
        />
    )
}