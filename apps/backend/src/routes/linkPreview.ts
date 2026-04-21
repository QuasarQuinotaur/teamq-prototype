import express from "express";
import * as cheerio from "cheerio";

const router = express.Router();

/** Reduce SSRF risk for server-side fetches (hostname / obvious private IPv4). */
function isUrlHostBlockedForProxy(u: URL): boolean {
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "0.0.0.0" || host.endsWith(".localhost")) {
        return true;
    }
    const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
    if (ipv4) {
        const a = Number(ipv4[1]);
        const b = Number(ipv4[2]);
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 0) return true;
        if (a === 169 && b === 254) return true;
        if (a === 192 && b === 168) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 100 && b >= 64 && b <= 127) return true;
    }
    return false;
}

/**
 * Same-origin image bytes for the browser so canvas can read pixels (avoids foreign favicon CORS).
 * GET /api/favicon-proxy?url=https%3A%2F%2F...
 */
router.get("/favicon-proxy", async (req, res) => {
    const raw = req.query.url;
    if (!raw || typeof raw !== "string") {
        return res.status(400).json({ error: "Missing url" });
    }

    let target: URL;
    try {
        target = new URL(raw);
    } catch {
        return res.status(400).json({ error: "Invalid URL" });
    }

    if (target.protocol !== "http:" && target.protocol !== "https:") {
        return res.status(400).json({ error: "Only http(s) URLs allowed" });
    }

    if (isUrlHostBlockedForProxy(target)) {
        return res.status(403).json({ error: "Host not allowed" });
    }

    try {
        const response = await fetch(target.href, {
            redirect: "follow",
            headers: {
                Accept: "image/*,*/*;q=0.8",
                "User-Agent":
                    "Mozilla/5.0 (compatible; Hanover/1.0; +https://github.com/) AppleWebKit/537.36",
            },
        });

        if (!response.ok) {
            return res.status(502).json({ error: "Upstream fetch failed" });
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().startsWith("image/")) {
            return res.status(415).json({ error: "Response is not an image" });
        }

        const buf = Buffer.from(await response.arrayBuffer());
        if (buf.length > 2 * 1024 * 1024) {
            return res.status(413).json({ error: "Image too large" });
        }

        res.setHeader("Content-Type", contentType.split(";")[0].trim());
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.send(buf);
    } catch (err) {
        console.error("favicon-proxy", err);
        res.status(500).json({ error: "Failed to proxy favicon" });
    }
});

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