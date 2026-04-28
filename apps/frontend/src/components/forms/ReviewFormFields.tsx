import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import DateSelectInput from "../input/DateSelectInput";

export type ReviewFields = {
    date: Date
}

export type ReviewDateStrings = {
    date: string,
    setDate: (date: string) => void,
}
type ReviewFormFieldsProps = {
    dateStrings: ReviewDateStrings
} & FormFieldsProps<ReviewFields>
export default function ReviewFormFields({
                                          dateStrings,
                                          fields,
                                          setKey,
}: ReviewFormFieldsProps) {
    return (
        <div className={"flex flex-col gap-6 w-full min-w-0 justify-center"}>
            <FieldInput
                id={"review-add-form-date"}
                label={"Date"}
                required
                createElement={(id) => (
                    <DateSelectInput
                        id={id}
                        placeholder={"Review Date"}
                        date={fields.date}
                        setDate={(date) => {
                            setKey("date", date)
                        }}
                        dateString={dateStrings.date}
                        setDateString={dateStrings.setDate}
                    />
                )}
            />
        </div>
    )
}