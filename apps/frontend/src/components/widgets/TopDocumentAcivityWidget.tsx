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

export default function TopDocumentActivityWidget() {
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
        return <div className="p-4">Loading top documents...</div>;
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