import Form, {type FormState} from "@/components/forms/Form.tsx";
import type {ContentReview} from "db";
import ReviewFormFields, { type ReviewDateStrings, type ReviewFields } from "./ReviewFormFields";
import { formatDate } from "@/lib/utils";
import { useState } from "react";


const DEFAULT_REVIEW_FIELDS: ReviewFields = {
    date: undefined
}

function itemAsReview(item: object): ReviewFields {
    const r = item as ContentReview;
    return {
        date: new Date(r.date)
    };
}

function getDefaultReviewFields(defaultItem: object = null): ReviewFields {
    return DEFAULT_REVIEW_FIELDS
}

function hasRequiredReviewFields(fields: ReviewFields): boolean {
    if (!fields.date) {
        return false
    }
    return true
}

export type ReviewFormProps = {
    contentId: number;
    onSubmitted?: () => void;
} & FormState
export default function ReviewForm({
                                    contentId,
                                    onSubmitted,
                                    ...state
}: ReviewFormProps) {
    const initialFields =
        state.baseItem ? itemAsReview(state.baseItem) :
            getDefaultReviewFields(state.defaultItem)
    const initialDateString =
        initialFields.date ? formatDate(initialFields.date) : ""
            
    const [dateString, setDateString] = useState(initialDateString)
    const dateStrings: ReviewDateStrings = {
        date: dateString,
        setDate: setDateString,
    };

    // Reset date strings
    function reset() {
        setDateString(initialDateString)
    }

    // Create or update review on backend from fields
    async function doSubmit(fields: ReviewFields) {
        console.log("SUBMIT:", fields)
        const isUpdate = state.baseItem != null;
        const url = isUpdate
            ? `${import.meta.env.VITE_BACKEND_URL}/api/reviews/${state.baseItem.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/reviews`;
        const review = {
            contentId: contentId,
            date: fields.date,

            // required, leaving blank for now
            stepName: "",

            // Stuff that could be added in the future
            // stepName: null,
            // employeeId: null,
            // note: null,
        }
        const response = await fetch(url, {
            method: isUpdate ? "PUT" : "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(review),
        })
        const result = await response.json()
        console.log("REPSONSE:", response, "|", result)
        if (response.ok && result && result.success) {
            if (onSubmitted) {
                onSubmitted()
            }
        } else {
            throw new Error(result ? result.error : `Failed to ${isUpdate ? "update" : "create"} review`)
        }
    }

    return (
        <Form
            state={state}
            initialFields={initialFields}
            createFieldsElement={(props) => (
                <ReviewFormFields
                    {...props}
                    dateStrings={dateStrings}
                />
            )}
            submit={doSubmit}
            reset={reset}
            getFieldsError={(fields) => {
                // Show an error if missing fields
                if (!hasRequiredReviewFields(fields)) {
                    return "Missing required fields."
                }
            }}
        />
    )
}