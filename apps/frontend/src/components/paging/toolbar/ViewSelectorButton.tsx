// Button that selects between different view options

import ButtonSelector, {type OptionDefinition} from "@/elements/buttons/button-selector.tsx";
import {GridFourIcon, ListBulletsIcon} from "@phosphor-icons/react";
import * as React from "react";
import type {ViewType} from "@/components/auth/hooks/use-create-main-context.tsx";

const VIEW_TYPE_OPTIONS: Record<ViewType, OptionDefinition> = {
    Grid: {
        buttonElement: <GridFourIcon/>
    },
    List: {
        buttonElement: <ListBulletsIcon/>
    },
}

// These props are passed in from toolbar to switch active view
export type ViewSelectorButtonProps = {
    view: ViewType
    setView: (view: ViewType) => void
}
export default function ViewSelectorButton({
                                                view,
                                                setView
}: ViewSelectorButtonProps ) {
    return (
        <ButtonSelector
            value={view}
            onChange={(val: ViewType) => setView(val)}
            options={VIEW_TYPE_OPTIONS}
        />
    )
}