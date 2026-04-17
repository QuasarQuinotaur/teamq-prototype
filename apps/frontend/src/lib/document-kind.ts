/**
 * Extensions we treat as "document-like" for inline viewing / split view (aligned with card thumbnails).
 */
const DOCUMENT_LIKE_EXT = new Set([
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "csv",
    "txt",
    "htm",
    "html",
]);

export function getExtensionFromFilename(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isDocumentLikeExtension(ext: string): boolean {
    return DOCUMENT_LIKE_EXT.has(ext.toLowerCase());
}

export function isDocumentLikeFilename(filename: string): boolean {
    if (!filename.includes(".")) return false;
    return isDocumentLikeExtension(getExtensionFromFilename(filename));
}
