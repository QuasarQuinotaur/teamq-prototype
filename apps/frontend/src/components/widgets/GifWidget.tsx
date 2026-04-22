export default function GifWidget({ url }: { url?: string }) {
    if (url && /\.gif(\?.*)?$/i.test(url)) {
        return (
            <div className="flex h-full w-full items-center justify-center overflow-hidden bg-muted">
                <img src={url} alt="" className="max-h-full max-w-full object-contain" />
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <iframe
                src="https://tenor.com/embed/25993381"
                className="h-full w-full border-0"
                allowFullScreen
            />
        </div>
    );
}
