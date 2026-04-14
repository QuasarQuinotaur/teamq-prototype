/** Cross-tab refresh when a document is checked out or checked in elsewhere. */
const CHANNEL = "hanover-content-checkout";

export function subscribeContentCheckoutSync(onRefresh: () => void): () => void {
    if (typeof BroadcastChannel === "undefined") {
        return () => {};
    }
    const bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = () => {
        onRefresh();
    };
    return () => {
        bc.close();
    };
}

export function notifyContentCheckoutSync(): void {
    if (typeof BroadcastChannel === "undefined") {
        return;
    }
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage("refresh");
    bc.close();
}
