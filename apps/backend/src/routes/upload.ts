import { uploadFile } from "../lib/supabase";

export async function POST(req: Request): Promise<Response> {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return new Response(JSON.stringify({ error: "No file uploaded" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const data = await uploadFile(file);

        return new Response(JSON.stringify({ ok: true, path: data.path }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Upload failed",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}