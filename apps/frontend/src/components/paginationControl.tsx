import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Field, FieldLabel } from "@/components/ui/field"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {useState} from "react";

function PaginationControl(props: {docNum: number}) {
    const [pageNum, setPageNum] = useState<number>(1);
    const docNum = props.docNum
    const [maxPages, setMaxPages] = useState<number>(Math.ceil(docNum/10));

    const prevExists = pageNum-1===0 ? "hidden" : ""
    const nextExists = pageNum===maxPages ? "hidden" : ""
    const moreExists: "hidden" | "" = pageNum+1 >= maxPages ? "hidden" : ""

    function handlePrev(){
        setPageNum(prev=> prev-1)
    }

    function handleNext(){
        setPageNum(prev=> prev+1)
    }

    function handleShowChange(value: string){
        setMaxPages(Math.ceil(docNum/Number(value)))
        console.log(maxPages)
    }

    return (
        <>
            <div className="flex items-center justify-center gap-4">
                <Field orientation="horizontal" className="w-fit">
                    <FieldLabel htmlFor="select-rows-per-page">Showing</FieldLabel>
                    <Select defaultValue="10" onValueChange={handleShowChange}>
                        <SelectTrigger className="w-20" id="select-rows-per-page">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                            <SelectGroup>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FieldLabel htmlFor="select-rows-per-page">of {docNum} documents</FieldLabel>
                </Field>
                <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                        <PaginationItem className={prevExists}>
                            <PaginationPrevious href="#" onClick={handlePrev}/>
                        </PaginationItem>
                        <PaginationItem className={prevExists}>
                            <PaginationLink href="#" onClick={handlePrev}>
                                {pageNum - 1}
                            </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink href="#" isActive>
                                {pageNum}
                            </PaginationLink>
                        </PaginationItem>
                        <PaginationItem className={nextExists}>
                            <PaginationLink href="#" onClick={handleNext}>
                                {pageNum + 1}
                            </PaginationLink>
                        </PaginationItem>
                        <PaginationItem className={moreExists}>
                            <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem className={nextExists}>
                            <PaginationNext href="#" onClick={handleNext}/>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </>
    )
}

export default PaginationControl