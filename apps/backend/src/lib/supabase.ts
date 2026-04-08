import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
);

export async function getSignedUrl(path: string, expiresIn = 60) {
    const { data, error } = await supabase.storage
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

    const { data, error } = await supabase.storage
        .from("uploads")
        .upload(filePath, buffer, {
            contentType,
            upsert: false,
        });

    if (error) throw error;

    return data;
}
