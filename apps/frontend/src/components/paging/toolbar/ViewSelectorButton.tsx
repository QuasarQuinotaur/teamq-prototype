// Button that selects between different view options

import ButtonSelector from "@/elements/buttons/button-selector.tsx";
import {GridFourIcon, ListBulletsIcon} from "@phosphor-icons/react";
import * as React from "react";

export type ViewType = "List" | "Grid";

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
            options={{
                Grid: {
                    buttonElement: <GridFourIcon/>
                },
                List: {
                    buttonElement: <ListBulletsIcon/>
                },
            }}
        />
    )
}