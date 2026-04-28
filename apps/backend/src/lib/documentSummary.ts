import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";

/** Max bytes loaded into summarization (aligned with typical API limits). */
export const MAX_SUMMARY_BYTES = 25 * 1024 * 1024;

/** Max UTF-8 characters sent as plain text after extraction. */
const MAX_TEXT_CHARS = 2_000_000;

/**
 * Default: Haiku 4.5 (fast / cheaper than Sonnet). Anthropic retires dated IDs; use the current
 * Haiku API id from https://platform.claude.com/docs/en/about-claude/models/overview
 * Override with CLAUDE_SUMMARY_MODEL if this alias 404s on your account.
 */
const DEFAULT_MODEL = "claude-haiku-4-5";

/** Required for PDF `document` content blocks on the Messages API. */
const PDF_BETA_HEADER = "pdfs-2024-09-25";

/**
 * Anthropic **Messages API** base URL (see API reference on https://docs.claude.com).
 * This is not the Claude Console / website origin (platform.claude.com).
 * Override only if Anthropic documents a different endpoint for your account (e.g. proxy): `ANTHROPIC_BASE_URL`.
 */
const ANTHROPIC_MESSAGES_API_DEFAULT = "https://api.anthropic.com";

function anthropicMessagesBaseUrl(): string {
    const fromEnv = process.env.ANTHROPIC_BASE_URL?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/+$/, "");
    }
    return ANTHROPIC_MESSAGES_API_DEFAULT;
}

/** Single-request timeout for Claude (ms). Override with ANTHROPIC_SUMMARY_TIMEOUT_MS. */
const CLAUDE_REQUEST_TIMEOUT_MS = (() => {
    const raw = process.env.ANTHROPIC_SUMMARY_TIMEOUT_MS?.trim();
    if (!raw) return 180_000;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 180_000;
})();

/**
 * Max output tokens for the summary (lower = faster, shorter). Override with CLAUDE_SUMMARY_MAX_TOKENS.
 * Clamped to [512, 8192].
 */
const CLAUDE_SUMMARY_MAX_TOKENS = (() => {
    const raw = process.env.CLAUDE_SUMMARY_MAX_TOKENS?.trim();
    /** Lower default = less latency and lower output cost; raise via env for longer summaries. */
    const fallback = 1024;
    if (!raw) return fallback;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(8192, Math.max(512, n));
})();

/** Max output tokens for tag suggestion (JSON only). */
const CLAUDE_TAG_SUGGEST_MAX_TOKENS = (() => {
    const raw = process.env.CLAUDE_TAG_SUGGEST_MAX_TOKENS?.trim();
    const fallback = 512;
    if (!raw) return fallback;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(1024, Math.max(128, n));
})();

const TAG_SUGGEST_SYSTEM_PROMPT = `You assign workplace document tags. Respond with ONLY a single JSON object and no other text before or after it.

The JSON must be exactly this shape: {"tagIds":[number,...]}

Rules:
- Every number in tagIds must be one of the allowed tag ids from the user message.
- Include only tags that clearly apply to the document content or title.
- Prefer a concise set (often 0–8 tags). Use [] if none fit.
- Do not invent ids. Do not add keys other than tagIds. Do not wrap the JSON in markdown code fences.`;

const log = (step: string, detail?: Record<string, unknown>) => {
    if (detail) {
        console.log(`[summary] ${step}`, detail);
    } else {
        console.log(`[summary] ${step}`);
    }
};

const SYSTEM_PROMPT = `You are a careful document analyst. Produce a clear, concise summary for workplace readers (prioritize brevity; skip filler).

Output rules:
- Use GitHub-flavored Markdown only (no HTML wrapper, no code fences around the whole answer).
- Use exactly these level-2 headings in this order, even if a section is brief:
  ## Overview
  ## Key points
  ## Definitions and jargon
  ## Risks, caveats, and missing context
  ## Suggested follow-ups
- Under each heading, use bullets or short paragraphs as appropriate.
- Quote the source sparingly (only when necessary for precision).
- If the document is empty, unreadable, or not in a supported form, say so under "Risks, caveats, and missing context" and still output all sections.`;

function taskPrompt(title: string): string {
    return `The document title (metadata) is: "${title.replace(/"/g, '\\"')}".

Summarize the attached or pasted document content following the system instructions.`;
}

export class SummaryBadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SummaryBadRequestError";
    }
}

export class SummaryUnsupportedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SummaryUnsupportedError";
    }
}

export class SummaryTooLargeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SummaryTooLargeError";
    }
}

function extFromFilename(filename: string): string {
    const base = filename.split("/").pop() ?? filename;
    const i = base.lastIndexOf(".");
    if (i <= 0) return "";
    return base.slice(i + 1).toLowerCase();
}

function isPdfBuffer(buf: Buffer): boolean {
    return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

function isZipBuffer(buf: Buffer): boolean {
    return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

function clampText(text: string): string {
    const t = text.replace(/\0/g, "").trim();
    if (t.length <= MAX_TEXT_CHARS) return t;
    return `${t.slice(0, MAX_TEXT_CHARS)}\n\n[Truncated after ${MAX_TEXT_CHARS} characters.]`;
}

async function extractTextForKind(
    buffer: Buffer,
    ext: string,
): Promise<{ kind: "pdf" } | { kind: "text"; text: string }> {
    if (ext === "pdf" || isPdfBuffer(buffer)) {
        return { kind: "pdf" };
    }

    if (ext === "docx") {
        const { value } = await mammoth.extractRawText({ buffer });
        return { kind: "text", text: clampText(value) };
    }

    if (ext === "" && isZipBuffer(buffer)) {
        try {
            const { value } = await mammoth.extractRawText({ buffer });
            return { kind: "text", text: clampText(value) };
        } catch {
            throw new SummaryUnsupportedError(
                "Could not read this file as Word (.docx). For spreadsheets or other formats, export as PDF or text first.",
            );
        }
    }

    if (ext === "doc") {
        const extractor = new WordExtractor();
        const doc = await extractor.extract(buffer);
        const parts = [
            doc.getBody(),
            doc.getHeaders(),
            doc.getFooters(),
            doc.getFootnotes(),
            doc.getEndnotes(),
        ].filter(Boolean);
        return { kind: "text", text: clampText(parts.join("\n\n")) };
    }

    if (ext === "htm" || ext === "html") {
        const html = buffer.toString("utf8");
        const $ = cheerio.load(html);
        const text = $("body").length ? $("body").text() : $.root().text();
        return { kind: "text", text: clampText(text) };
    }

    if (
        ext === "txt" ||
        ext === "csv" ||
        ext === "md" ||
        ext === "json" ||
        ext === "xml"
    ) {
        return { kind: "text", text: clampText(buffer.toString("utf8")) };
    }

    if (ext === "xls" || ext === "xlsx" || ext === "ppt" || ext === "pptx") {
        throw new SummaryUnsupportedError(
            "This file type cannot be summarized yet. Try PDF, Word (.doc/.docx), HTML, or plain text.",
        );
    }

    // Unknown extension: try UTF-8 text if it looks mostly printable
    const asUtf8 = buffer.toString("utf8");
    const sample = asUtf8.slice(0, Math.min(asUtf8.length, 8000));
    const ctrl = [...sample].filter((c) => {
        const code = c.charCodeAt(0);
        return code < 9 || (code > 13 && code < 32);
    }).length;
    if (ctrl / Math.max(sample.length, 1) < 0.02 && sample.trim().length > 0) {
        return { kind: "text", text: clampText(asUtf8) };
    }

    if (isPdfBuffer(buffer)) {
        return { kind: "pdf" };
    }

    throw new SummaryUnsupportedError(
        "Unsupported or binary file type for AI summary. Use PDF, .doc, .docx, HTML, or text-based formats.",
    );
}

function messageTextFromResponse(
    response: Anthropic.Message,
): string {
    const parts: string[] = [];
    for (const block of response.content) {
        if (block.type === "text") {
            parts.push(block.text);
        }
    }
    return parts.join("\n").trim();
}

function tagSuggestUserPayload(
    title: string,
    candidateTags: { id: number; tagName: string }[],
): string {
    const catalog = JSON.stringify(
        candidateTags.map((t) => ({ id: t.id, tagName: t.tagName })),
    );
    return `Document title (metadata): ${JSON.stringify(title)}

Allowed tags (you may ONLY use these id values in tagIds):
${catalog}

Read the attached or pasted document. Return {"tagIds":[...]} with the subset of allowed tag ids that best describe this document.`;
}

function parseJsonObjectFromModelText(text: string): Record<string, unknown> {
    let t = text.trim();
    const fence = /^```(?:json)?\s*([\s\S]*?)```/i.exec(t);
    if (fence) {
        t = fence[1].trim();
    }
    const obj = JSON.parse(t) as unknown;
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        throw new Error("Model did not return a JSON object");
    }
    return obj as Record<string, unknown>;
}

function normalizeSuggestedTagIds(
    parsed: Record<string, unknown>,
    allowed: Set<number>,
): number[] {
    const raw = parsed.tagIds;
    if (!Array.isArray(raw)) {
        throw new Error('Model JSON must include a "tagIds" array');
    }
    const out: number[] = [];
    const seen = new Set<number>();
    for (const x of raw) {
        if (typeof x !== "number" || !Number.isInteger(x)) {
            continue;
        }
        if (!allowed.has(x) || seen.has(x)) {
            continue;
        }
        seen.add(x);
        out.push(x);
    }
    return out;
}

/**
 * Calls Claude with the document bytes and returns allowed tag ids that fit the content.
 * Caller must enforce buffer size and storage-only paths.
 */
export async function suggestTagIdsFromContent(params: {
    buffer: Buffer;
    filename: string;
    title: string;
    candidateTags: { id: number; tagName: string }[];
}): Promise<number[]> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const model =
        process.env.CLAUDE_SUMMARY_MODEL?.trim() || DEFAULT_MODEL;

    if (params.candidateTags.length === 0) {
        return [];
    }

    const allowed = new Set(params.candidateTags.map((t) => t.id));

    if (params.buffer.length > MAX_SUMMARY_BYTES) {
        throw new SummaryTooLargeError(
            `Document exceeds the ${MAX_SUMMARY_BYTES / (1024 * 1024)} MB limit for AI tag suggestions.`,
        );
    }

    const ext = extFromFilename(params.filename);
    log("tagSuggest:extract:start", {
        filename: params.filename,
        ext: ext || "(none)",
        bytes: params.buffer.length,
    });
    const t0 = Date.now();
    const extracted = await extractTextForKind(params.buffer, ext);
    log("tagSuggest:extract:done", {
        ms: Date.now() - t0,
        kind: extracted.kind,
        textChars: extracted.kind === "text" ? extracted.text.length : undefined,
    });

    const baseURL = anthropicMessagesBaseUrl();
    const client = new Anthropic({
        apiKey,
        baseURL,
        timeout: CLAUDE_REQUEST_TIMEOUT_MS,
        maxRetries: 1,
    });

    const payload = tagSuggestUserPayload(params.title, params.candidateTags);

    const userContent: Anthropic.MessageCreateParams["messages"][number]["content"] =
        extracted.kind === "pdf"
            ? [
                  {
                      type: "document",
                      source: {
                          type: "base64",
                          media_type: "application/pdf",
                          data: params.buffer.toString("base64"),
                      },
                  },
                  {
                      type: "text",
                      text: payload,
                  },
              ]
            : [
                  {
                      type: "text",
                      text: `${payload}\n\n---\n\nDocument text:\n\n${extracted.text || "(empty)"}`,
                  },
              ];

    let response: Anthropic.Message;
    try {
        const requestOptions =
            extracted.kind === "pdf"
                ? { headers: { "anthropic-beta": PDF_BETA_HEADER } }
                : undefined;

        log("tagSuggest:claude:request", {
            baseURL,
            model,
            maxTokens: CLAUDE_TAG_SUGGEST_MAX_TOKENS,
            inputKind: extracted.kind,
        });
        const t1 = Date.now();
        response = await client.messages.create(
            {
                model,
                max_tokens: CLAUDE_TAG_SUGGEST_MAX_TOKENS,
                system: TAG_SUGGEST_SYSTEM_PROMPT,
                messages: [{ role: "user", content: userContent }],
            },
            requestOptions,
        );
        log("tagSuggest:claude:response", {
            ms: Date.now() - t1,
            stopReason: response.stop_reason,
        });
    } catch (err) {
        console.error("[tagSuggest] Claude error", err);
        throw err;
    }

    const out = messageTextFromResponse(response);
    if (!out) {
        throw new Error("Empty response from tag suggestion model");
    }

    let parsed: Record<string, unknown>;
    try {
        parsed = parseJsonObjectFromModelText(out);
    } catch (e) {
        console.error("[tagSuggest] JSON parse failed", { snippet: out.slice(0, 500) });
        throw new Error(
            e instanceof Error
                ? e.message
                : "Could not parse tag suggestion response",
        );
    }

    const ids = normalizeSuggestedTagIds(parsed, allowed);
    log("tagSuggest:success", { count: ids.length });
    return ids;
}

/**
 * Calls Claude with the document bytes. Caller must enforce buffer size and storage-only paths.
 */
export async function summarizeContentBuffer(params: {
    buffer: Buffer;
    filename: string;
    title: string;
}): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const model =
        process.env.CLAUDE_SUMMARY_MODEL?.trim() || DEFAULT_MODEL;

    if (params.buffer.length > MAX_SUMMARY_BYTES) {
        throw new SummaryTooLargeError(
            `Document exceeds the ${MAX_SUMMARY_BYTES / (1024 * 1024)} MB limit for summarization.`,
        );
    }

    const ext = extFromFilename(params.filename);
    log("extract:start", {
        filename: params.filename,
        ext: ext || "(none)",
        bytes: params.buffer.length,
    });
    const t0 = Date.now();
    const extracted = await extractTextForKind(params.buffer, ext);
    log("extract:done", {
        ms: Date.now() - t0,
        kind: extracted.kind,
        textChars: extracted.kind === "text" ? extracted.text.length : undefined,
    });

    const baseURL = anthropicMessagesBaseUrl();
    const client = new Anthropic({
        apiKey,
        baseURL,
        timeout: CLAUDE_REQUEST_TIMEOUT_MS,
        maxRetries: 1,
    });

    const userContent: Anthropic.MessageCreateParams["messages"][number]["content"] =
        extracted.kind === "pdf"
            ? [
                  {
                      type: "document",
                      source: {
                          type: "base64",
                          media_type: "application/pdf",
                          data: params.buffer.toString("base64"),
                      },
                  },
                  {
                      type: "text",
                      text: taskPrompt(params.title),
                  },
              ]
            : [
                  {
                      type: "text",
                      text: `${taskPrompt(params.title)}\n\n---\n\nDocument text:\n\n${extracted.text || "(empty)"}`,
                  },
              ];

    let response: Anthropic.Message;
    try {
        const requestOptions =
            extracted.kind === "pdf"
                ? { headers: { "anthropic-beta": PDF_BETA_HEADER } }
                : undefined;

        log("claude:request", {
            baseURL,
            model,
            maxTokens: CLAUDE_SUMMARY_MAX_TOKENS,
            inputKind: extracted.kind,
            timeoutMs: CLAUDE_REQUEST_TIMEOUT_MS,
        });
        const t1 = Date.now();
        response = await client.messages.create(
            {
                model,
                max_tokens: CLAUDE_SUMMARY_MAX_TOKENS,
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: userContent }],
            },
            requestOptions,
        );
        log("claude:response", {
            ms: Date.now() - t1,
            stopReason: response.stop_reason,
            contentBlocks: response.content.length,
        });
    } catch (err) {
        console.error("[summary] Claude summarize error", err);
        throw err;
    }

    const out = messageTextFromResponse(response);
    if (!out) {
        log("claude:empty_text_blocks", {
            rawBlockTypes: response.content.map((b) => b.type),
        });
        throw new Error("Empty response from summarization model");
    }
    log("claude:success", { markdownChars: out.length });
    return out;
}
