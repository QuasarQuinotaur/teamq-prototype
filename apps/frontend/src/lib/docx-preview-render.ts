import type { Options } from "docx-preview";

/** Shared with DocumentViewer DocxViewer and DocxCardThumb — keep preview output consistent. */
export const DOCX_PREVIEW_RENDER_OPTIONS: Partial<Options> = {
    className: "docx-preview-container",
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    ignoreFonts: false,
    breakPages: true,
    useBase64URL: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
};
