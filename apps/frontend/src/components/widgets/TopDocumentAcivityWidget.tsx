import { useEffect, useState } from "react";
import { Eye, Download, FileText } from "lucide-react";

type Document = {
    id: number;
    title: string;
};

type DocumentStats = {
    id: number;
    name: string;
    viewCount: number;
    downloadCount: number;
};

type Props = {
    limit?: number;
};

export default function TopDocumentActivityWidget({limit = 5}: Props) {
    const [data, setData] = useState<DocumentStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get all documents
                const docsRes = await fetch("/api/content");
                const docs: Document[] = await docsRes.json();

                console.log(docs);

                // 2. Fetch stats for each document
                const statsPromises = docs.map(async (doc) => {
                    const res = await fetch(`/api/content/${doc.id}/stats`);
                    const stats = await res.json();

                    return {
                        id: doc.id,
                        name: doc.title,
                        viewCount: stats.viewCount || 0,
                        downloadCount: stats.downloadCount || 0,
                    };
                });

                const combined = await Promise.all(statsPromises);

                // 3. Sort by views + downloads and take top 5
                const sorted = combined
                    .sort((a, b) => (b.viewCount + b.downloadCount) - (a.viewCount + a.downloadCount))
                    .slice(0, limit);

                setData(sorted);
            } catch (err) {
                console.error("Failed to fetch document activity", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {/* header skeleton */}
                <div className="h-5 w-40 bg-gray-200 rounded" />

                {/* list skeleton */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="flex justify-between items-center p-2 rounded-lg"
                    >
                        <div className="flex items-center gap-2 w-full">
                            <div className="w-6 h-4 bg-gray-200 rounded" />
                            <div className="h-4 w-40 bg-gray-200 rounded" />
                        </div>

                        <div className="flex gap-4">
                            <div className="h-4 w-8 bg-gray-200 rounded" />
                            <div className="h-4 w-8 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Top Document Activity
            </h2>

            <div className="space-y-2">
                {data.map((doc, index) => (
                    <div
                        key={doc.id}
                        className={`flex justify-between items-center p-2 rounded-lg ${
                            index === 0 ? "bg-gray-100 font-medium" : ""
                        }`}
                    >
                        {/* Left side */}
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-6 text-sm text-gray-500">
                                #{index + 1}
                            </span>
                            <span className="truncate max-w-[180px]">
                                {doc.name}
                            </span>
                        </div>

                        {/* Right side */}
                        <div className="flex gap-4 text-sm text-gray-600">
                            <span><Eye className="w-4 h-4" /> {doc.viewCount}</span>
                            <span><Download className="w-4 h-4" /> {doc.downloadCount}</span>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}