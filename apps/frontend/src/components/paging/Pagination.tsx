import * as React from "react"

import { cn } from "@/lib/utils.ts"
import { Button } from "@/elements/buttons/button.tsx"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
import {useEffect, useMemo, useState} from "react";

function PaginationContainer({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      asChild
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
    >
      <a
        aria-current={isActive ? "page" : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      />
    </Button>
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon
      />
      <span className="sr-only">More pages</span>
    </span>
  )
}

type PaginationProps = {
  docNum: number,
  docsPerPage: number,
  pageNum: number,
  setPageNum: React.Dispatch<React.SetStateAction<number>>
  updatePageEntries: (viewPageNum: number) => void;
}
export default function Pagination({
                                     docNum,
                                     docsPerPage,
                                     pageNum,
                                     setPageNum,
                                     updatePageEntries
}: PaginationProps) {
  const maxPages = Math.max(1, Math.ceil(docNum/docsPerPage));

  // Needed to remember page state without viewing over max pages
  /**
   * Ex:
   * 1. on page 2 in list view
   * 2. search for a result, only 1 page of results shows up
   * 3. clear search, 2 pages again. remember user was on page 2
   */
  const clampedPageNum = useMemo(() => {
    return Math.max(Math.min(pageNum, maxPages), 1)
  }, [maxPages, pageNum])
  useEffect(() => {
    updatePageEntries(clampedPageNum)
  }, [clampedPageNum, updatePageEntries])

  const prevExists = clampedPageNum-1===0 ? "hidden" : ""
  const nextExists = clampedPageNum===maxPages ? "hidden" : ""
  const moreExists: "hidden" | "" = clampedPageNum+1 >= maxPages ? "hidden" : ""

  function handlePrev(){
    setPageNum(prev=> Math.max(Math.min(prev, maxPages) - 1, 1))
  }

  function handleNext(){
    setPageNum(prev=> Math.min(Math.max(prev, 1) + 1, maxPages))
  }

  // function handleShowChange(value: string){
  //   setMaxPages(Math.ceil(docNum/Number(value)))
  // }

  return (
      <>
        <div className="flex items-center justify-center pt-10">
          <PaginationContainer className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem className={prevExists}>
                <PaginationPrevious href="#" onClick={handlePrev}/>
              </PaginationItem>
              <PaginationItem className={prevExists}>
                <PaginationLink href="#" onClick={handlePrev}>
                  {clampedPageNum - 1}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {clampedPageNum}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem className={nextExists}>
                <PaginationLink href="#" onClick={handleNext}>
                  {clampedPageNum + 1}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem className={moreExists}>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem className={nextExists}>
                <PaginationNext href="#" onClick={handleNext}/>
              </PaginationItem>
            </PaginationContent>
          </PaginationContainer>
        </div>
        {/*<div className="flex items-center justify-center gap-4 pt-2">*/}
        {/*  <Field orientation="horizontal" className="w-fit">*/}
        {/*    <FieldLabel htmlFor="select-rows-per-page">Showing</FieldLabel>*/}
        {/*    <Select defaultValue="5" onValueChange={handleShowChange}>*/}
        {/*      <SelectTrigger className="w-15" id="select-rows-per-page">*/}
        {/*        <SelectValue />*/}
        {/*      </SelectTrigger>*/}
        {/*      <SelectContent align="start">*/}
        {/*        <SelectGroup>*/}
        {/*          <SelectItem value="5">5</SelectItem>*/}
        {/*          <SelectItem value="10">10</SelectItem>*/}
        {/*          <SelectItem value="15">15</SelectItem>*/}
        {/*          <SelectItem value="20">20</SelectItem>*/}
        {/*        </SelectGroup>*/}
        {/*      </SelectContent>*/}
        {/*    </Select>*/}
        {/*    <FieldLabel htmlFor="select-rows-per-page">of {docNum} results</FieldLabel>*/}
        {/*  </Field>*/}
        {/*</div>*/}
      </>
  )
}
