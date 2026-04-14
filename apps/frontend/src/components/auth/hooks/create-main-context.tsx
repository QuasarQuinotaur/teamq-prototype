// Creates main context to use on per-website visit

import {useState} from "react";

export type MainContext = {
    view: ViewType,
    setView: (view: ViewType) => void,
}
export type ViewType = "List" | "Grid"

/**
 * Creates a MainContext to use for shared per-visit state across logged-in website.
 */
export default function createMainContext(): MainContext {
    const [view, setView] = useState<ViewType>("Grid");
    return {
        view, setView
    }
}