import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!,
        );
    }
    return _supabase;
}

export async function getSignedUrl(path: string, expiresIn = 60) {
    const { data, error } = await getSupabase().storage
        .from("uploads")
        .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
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
