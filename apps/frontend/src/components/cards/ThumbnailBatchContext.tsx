/* eslint-disable react-refresh/only-export-components -- hook + provider share module */
import * as React from "react";

export type ThumbnailBatchContextValue = {
    loadAllowed: boolean;
    revealThumbnails: boolean;
    onThumbReady: (contentId: number) => void;
};

const defaultThumbnailBatchContext: ThumbnailBatchContextValue = {
    loadAllowed: true,
    revealThumbnails: true,
    onThumbReady: () => {},
};

export const ThumbnailBatchContext =
    React.createContext<ThumbnailBatchContextValue>(defaultThumbnailBatchContext);

export function useThumbnailBatch(): ThumbnailBatchContextValue {
    return React.useContext(ThumbnailBatchContext);
}

type ThumbnailBatchProviderProps = {
    batchKey: string | number;
    expectedContentIds: number[];
    children: React.ReactNode;
};

/**
 * Gates parallel thumbnail loading for one grid slice: after `loadAllowed`, children load hidden
 * until every `expectedContentIds` calls `onThumbReady`, then `revealThumbnails` becomes true.
 */
export function ThumbnailBatchProvider({
    batchKey,
    expectedContentIds,
    children,
}: ThumbnailBatchProviderProps) {
    const [loadAllowed, setLoadAllowed] = React.useState(false);
    const [revealThumbnails, setRevealThumbnails] = React.useState(false);
    const settledRef = React.useRef<Set<number>>(new Set());

    const expectedSet = React.useMemo(() => new Set(expectedContentIds), [expectedContentIds]);

    React.useLayoutEffect(() => {
        settledRef.current = new Set();
        setRevealThumbnails(false);
        setLoadAllowed(false);
    }, [batchKey]);

    React.useEffect(() => {
        let cancelled = false;
        const handle = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!cancelled) setLoadAllowed(true);
            });
        });
        return () => {
            cancelled = true;
            cancelAnimationFrame(handle);
        };
    }, [batchKey]);

    React.useEffect(() => {
        if (expectedContentIds.length === 0) {
            setRevealThumbnails(true);
        }
    }, [batchKey, expectedContentIds.length]);

    const onThumbReady = React.useCallback(
        (contentId: number) => {
            if (!expectedSet.has(contentId)) return;
            settledRef.current.add(contentId);
            if (settledRef.current.size >= expectedContentIds.length) {
                setRevealThumbnails(true);
            }
        },
        [expectedContentIds.length, expectedSet],
    );

    const value = React.useMemo(
        (): ThumbnailBatchContextValue => ({
            loadAllowed,
            revealThumbnails,
            onThumbReady,
        }),
        [loadAllowed, revealThumbnails, onThumbReady],
    );

    return (
        <ThumbnailBatchContext.Provider value={value}>{children}</ThumbnailBatchContext.Provider>
    );
}
