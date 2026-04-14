import * as React from "react";
import type {ComponentProps} from "react";

import {DOCUMENT_TYPE_MAP, type DocumentType} from "@/components/input/constants.tsx";
import ComboboxMapInput from "@/components/input/ComboboxMapInput.tsx";
import {ComboboxChipsInput} from "@/components/Combobox.tsx";


type DocumentTypeInputProps = {
    documentTypes: DocumentType[];
    setDocumentTypes: (documentTypes: DocumentType[]) => void;
} & ComponentProps<typeof ComboboxChipsInput>
export default function DocumentTypeInput(props: DocumentTypeInputProps) {
    return (
        <ComboboxMapInput
            map={DOCUMENT_TYPE_MAP}
            values={props.documentTypes}
            setValues={props.setDocumentTypes}
            placeholder={"Document Type"}
            emptyText={"No document types found."}
            {...props}
        />
    )
}