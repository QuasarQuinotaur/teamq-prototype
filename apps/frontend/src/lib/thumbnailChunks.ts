/** Inner `CardGrid` batches wait for every card in a chunk before revealing thumbnails. */

export const THUMBNAIL_CHUNK_SIZE = 8;

export function toChunkSizes(total: number, chunkSize: number): number[] {
    if (total <= 0 || chunkSize <= 0) return [];
    const out: number[] = [];
    let remaining = total;
    while (remaining > 0) {
        const n = Math.min(chunkSize, remaining);
        out.push(n);
        remaining -= n;
    }
    return out;
}
