/**
 * Solid RGB from a favicon URL for link card thumbnails.
 *
 * Many favicon hosts do not send CORS headers, so drawing them on a canvas “taints” it and
 * `getImageData` throws. We try the URL in the browser first; if that fails, we load the
 * same bytes via `/api/favicon-proxy` (server-side fetch is not CORS-limited) so the
 * image is readable under our API’s CORS policy.
 */

export type Rgb = { r: number; g: number; b: number };

function averageRgbFromImageData(data: Uint8ClampedArray, width: number, height: number): Rgb {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    const pixels = width * height;
    const step = Math.max(1, Math.floor(Math.sqrt(pixels / 2500)));

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const i = (y * width + x) * 4;
            const a = data[i + 3];
            if (a < 12) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
        }
    }

    if (n === 0) {
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
        }
    }

    return {
        r: Math.round(r / n),
        g: Math.round(g / n),
        b: Math.round(b / n),
    };
}

function rgbFromCanvasWithImageSource(
    source: CanvasImageSource,
    naturalWidth: number,
    naturalHeight: number,
): Rgb | null {
    const maxDim = 64;
    let w = naturalWidth;
    let h = naturalHeight;
    if (w === 0 || h === 0) return null;
    if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.max(1, Math.floor(w * scale));
        h = Math.max(1, Math.floor(h * scale));
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    try {
        ctx.drawImage(source, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        return averageRgbFromImageData(data, w, h);
    } catch {
        return null;
    }
}

async function averageRgbViaImageElement(url: string): Promise<Rgb | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                resolve(rgbFromCanvasWithImageSource(img, img.naturalWidth, img.naturalHeight));
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

async function averageRgbFromImageUrlOnce(imageUrl: string): Promise<Rgb | null> {
    try {
        const res = await fetch(imageUrl, { mode: "cors", credentials: "omit" });
        if (!res.ok) return (await averageRgbViaImageElement(imageUrl)) ?? null;
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);

        const maxDim = 64;
        let w = bitmap.width;
        let h = bitmap.height;
        if (w === 0 || h === 0) {
            bitmap.close();
            return (await averageRgbViaImageElement(imageUrl)) ?? null;
        }
        if (w > maxDim || h > maxDim) {
            const scale = maxDim / Math.max(w, h);
            w = Math.max(1, Math.floor(w * scale));
            h = Math.max(1, Math.floor(h * scale));
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
            bitmap.close();
            return (await averageRgbViaImageElement(imageUrl)) ?? null;
        }
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close();

        try {
            const { data } = ctx.getImageData(0, 0, w, h);
            return averageRgbFromImageData(data, w, h);
        } catch {
            return (await averageRgbViaImageElement(imageUrl)) ?? null;
        }
    } catch {
        return (await averageRgbViaImageElement(imageUrl)) ?? null;
    }
}

function faviconProxyUrl(originalFaviconUrl: string): string | null {
    const base = import.meta.env.VITE_BACKEND_URL;
    if (!base || typeof base !== "string") return null;
    return `${base.replace(/\/$/, "")}/api/favicon-proxy?url=${encodeURIComponent(originalFaviconUrl)}`;
}

/** Returns average RGB from a favicon image URL, or null if decoding fails everywhere. */
export async function getAverageRgbFromFaviconUrl(url: string): Promise<Rgb | null> {
    const direct = await averageRgbFromImageUrlOnce(url);
    if (direct) return direct;

    const proxied = faviconProxyUrl(url);
    if (!proxied) return null;

    return (await averageRgbFromImageUrlOnce(proxied)) ?? null;
}

export function rgbToCss({ r, g, b }: Rgb): string {
    return `rgb(${r}, ${g}, ${b})`;
}
