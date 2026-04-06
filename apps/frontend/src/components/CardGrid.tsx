import CardImage from "@/components/cardImage.tsx";

export type CardEntry = {
    title: string;
    link: string;
    description?: string;
    badge?: string;
}
type CardGridProps = {
    entries: CardEntry[];
    defaultBadge: string;
}
function CardGrid({ entries, defaultBadge }: CardGridProps) {
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {entries.map((entry) => (
                <CardImage
                    title={entry.title}
                    description={entry.description ?? ""}
                    badge={entry.badge ?? defaultBadge}
                    action="View"
                    link={entry.link}
                />
            ))}
        </div>
    )
}

export {
    CardGrid
}