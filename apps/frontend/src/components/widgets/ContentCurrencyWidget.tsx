import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

type Content = {
    id: number;
    title: string;
    dateAdded: string;
    dateUpdated?: string | null;
};

export default function ContentCurrencyWidget() {
    const [docs, setDocs] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await fetch("/api/content", {
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) throw new Error("Failed to fetch content");
                setDocs(data);
            } catch (err) {
                console.error("Failed to fetch content", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, []);

    const now = new Date();
    const getDaysSince = (date: string) =>
        (now.getTime() - new Date(date).getTime()) /
        (1000 * 60 * 60 * 24);

    let current = 0;
    let review = 0;
    let outdated = 0;

    docs.forEach((doc) => {
        const days = getDaysSince(doc.dateUpdated || doc.dateAdded);

        if (days <= 30) current++;
        else if (days <= 90) review++;
        else outdated++;
    });

    const total = current + review + outdated;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />

                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-10 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Content Currency
            </h2>

            <p className="text-xs text-muted-foreground mb-1">
                Based on last updated date
            </p>

            <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                <span>Current &lt; 30d</span>
                <span>Review 30–90d</span>
                <span>Outdated &gt; 90d</span>
            </div>

            <div className="space-y-4">
                <Row
                    color="var(--success)"
                    label="Current"
                    value={current}
                    percent={pct(current)}
                />
                <Row
                    color="var(--warning)"
                    label="Review Soon"
                    value={review}
                    percent={pct(review)}
                />
                <Row
                    color="var(--danger)"
                    label="Outdated"
                    value={outdated}
                    percent={pct(outdated)}
                />
            </div>
        </div>
    );
}

function Row({
                 color,
                 label,
                 value,
                 percent,
             }: {
    color: string;
    label: string;
    value: number;
    percent: number;
}) {
    return (
        <div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-foreground">{label}</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                    {value} ({percent}%)
                </span>
            </div>

            <div className="h-1.5 bg-muted rounded mt-1">
                <div
                    className="h-full rounded"
                    style={{
                        width: `${percent}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
        </div>
    );
}