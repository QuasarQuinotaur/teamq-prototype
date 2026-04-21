import {Label} from "@/elements/label.tsx";
import * as React from "react";

type DetailProps = {
    label: string;
    value: React.ReactNode;
}
export default function Detail({
                                   label,
                                   value
}: DetailProps) {
    return (
        <div className={"flex flex-col gap-1 text-[0.9rem]"}>
            <b>{label}</b>
            {value}
        </div>
    )
}