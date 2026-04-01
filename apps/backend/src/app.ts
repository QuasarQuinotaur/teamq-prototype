import "dotenv/config";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import { uploadBuffer } from "./lib/supabase.ts";

const app = express();
const port = 3001;

app.use(express.json());
app.use(morgan("dev"));

const upload = multer();

app.get("/", (_req, res) => {
    res.sendStatus(200);
});

app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const data = await uploadBuffer(
            file.buffer,
            file.originalname,
            file.mimetype,
        );

        res.json({ success: true, path: data.path });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Upload failed",
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;