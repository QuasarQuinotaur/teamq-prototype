// Creates main context to use on per-website visit

import {useState} from "react";

export type MainContext = {
    view: ViewType,
    setView: (view: ViewType) => void,
    favoritesOpen: boolean,
    setFavoritesOpen: (favoritesOpen: boolean) => void,
}
export type ViewType = "List" | "Grid"

/**
 * Creates a MainContext to use for shared per-visit state across logged-in website.
 */
export default function useCreateMainContext(): MainContext {
    const [view, setView] = useState<ViewType>("Grid");
    const [favoritesOpen, setFavoritesOpen] = useState(false);
    return {
        view,
        setView,
        favoritesOpen,
        setFavoritesOpen,
    }
}