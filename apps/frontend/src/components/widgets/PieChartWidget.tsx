"use client"

import { Pie, PieChart, Cell } from "recharts"
import { Loader2 } from "lucide-react"

import {
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/cards/Card.tsx"

export default function PieChartWidget({ counts, loading }: { counts: any; loading?: boolean }) {
    if (loading) {
        return (
            <div
                className="flex h-full min-h-[200px] flex-col items-center justify-center"
                aria-busy="true"
                aria-label="Loading"
            >
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
            </div>
        );
    }

    const data = [
        { name: "Done", value: counts.done, color: "#22C55E" },
        { name: "Overdue", value: counts.overdue, color: "#EF4444" },
        { name: "Due this week", value: counts.dueWeek, color: "#FACC15" },
        { name: "Upcoming", value: counts.todo, color: "#5B8DB8" },
    ]

    const total = data.reduce((acc, item) => acc + item.value, 0)

    const totalRequests = counts.todo + counts.done + counts.overdue + counts.dueWeek
    const completion =
        total === 0 ? 0 : Math.round((counts.done / totalRequests) * 100)

    return (
        <div className="flex h-full flex-col">
            <CardHeader>
                <CardTitle>Requests Progress</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-1 items-center justify-center">
                <div className="relative">
                    <PieChart width={220} height={220}>
                        <Pie
                            data={data}
                            dataKey="value"
                            innerRadius={70}
                            outerRadius={90}
                            stroke="none"
                            cornerRadius={6}
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-semibold">
                            {completion + "%"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Done
                        </span>
                    </div>
                </div>
            </CardContent>

            {/* Custom Legend (cleaner) */}
            <div className="flex justify-center gap-4 pb-4 text-sm">
                {data.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground">
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}