import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!,
        );
    }
    return supabase;
}

export async function getSignedUrl(path: string, expiresIn = 60) {
    const { data, error } = await getSupabase().storage
        .from("uploads")
        .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
}

/** Max wait for storage before giving up (avoids multi‑minute hangs on bad gateway / network issues). */
const DEFAULT_SIGNED_URL_TIMEOUT_MS = 10_000;

/**
 * Like {@link getSignedUrl} but never throws: returns `undefined` on error or timeout.
 * Prefer this for list endpoints so one bad photo does not fail the whole response.
 */
export async function tryGetSignedUrl(
    path: string,
    expiresIn = 60,
    timeoutMs = DEFAULT_SIGNED_URL_TIMEOUT_MS,
): Promise<string | undefined> {
    try {
        const pending = getSignedUrl(path, expiresIn);
        if (timeoutMs <= 0) {
            return await pending;
        }
        const timeout = new Promise<never>((_, reject) => {
            setTimeout(
                () =>
                    reject(
                        new Error(
                            `getSignedUrl timed out after ${timeoutMs}ms`,
                        ),
                    ),
                timeoutMs,
            );
        });
        return await Promise.race([pending, timeout]);
    } catch (err) {
        console.warn("[supabase] tryGetSignedUrl failed:", path, err);
        return undefined;
    }
}

export async function deleteFile(path: string) {
    const { error } = await getSupabase().storage.from("uploads").remove([path]);
    if (error) throw new Error(error.message);
}

export async function downloadBuffer(path: string): Promise<Buffer> {
    const { data, error } = await getSupabase().storage
        .from("uploads")
        .download(path);

    if (error) throw error;
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export async function uploadBuffer(
    buffer: Buffer,
    fileName: string,
    contentType: string,
) {
    const filePath = `uploads/${fileName}`;

    const { data, error } = await getSupabase().storage
        .from("uploads")
        .upload(filePath, buffer, {
            contentType,
            upsert: false,
        });

    if (error) throw error;

    return data;
}
