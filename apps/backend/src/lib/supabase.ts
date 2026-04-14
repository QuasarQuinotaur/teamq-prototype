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

export async function deleteFile(path: string) {
    const { error } = await supabase.storage.from("uploads").remove([path]);
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
