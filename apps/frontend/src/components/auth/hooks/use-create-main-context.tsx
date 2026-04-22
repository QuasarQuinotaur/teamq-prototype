// Creates main context to use on per-website visit

import {useState} from "react";
import { getStoredView } from "@/lib/theme.ts";

export type MainContext = {
    view: ViewType,
    setView: (view: ViewType) => void,
    favoritesOpen: boolean,
    setFavoritesOpen: (favoritesOpen: boolean) => void,
    tagsEnabled: boolean,
    setTagsEnabled: (tagsEnabled: boolean) => void,
}
export type ViewType = "List" | "Grid"

/**
 * Creates a MainContext to use for shared per-visit state across logged-in website.
 */
export default function useCreateMainContext(): MainContext {
    const [view, setView] = useState<ViewType>(getStoredView);
    const [favoritesOpen, setFavoritesOpen] = useState(false);
    const [tagsEnabled, setTagsEnabled] = useState(true);
    return {
        view,
        setView,
        favoritesOpen,
        setFavoritesOpen,
        tagsEnabled,
        setTagsEnabled,
    }
}