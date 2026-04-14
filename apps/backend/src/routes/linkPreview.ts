import express from "express";
import * as cheerio from "cheerio";

const router = express.Router();

router.get("/link-preview", async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Invalid URL" });
    }

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            },
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        const getMeta = (prop: string) =>
            $(`meta[property='${prop}']`).attr("content") ||
            $(`meta[name='${prop}']`).attr("content");

        res.json({
            title: getMeta("og:title") || $("title").text(),
            description: getMeta("og:description") || "",
            image: getMeta("og:image") || "",
            siteName: getMeta("og:site_name") || "",
            url,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch preview" });
    }
});

export default router;