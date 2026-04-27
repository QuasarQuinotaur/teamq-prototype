import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import { useEffect, useState } from "react";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { CardHeader, CardTitle } from "@/components/cards/Card.tsx";

const localizer = momentLocalizer(moment);

type Expiration = {
    id: number;
    title: string;
    expirationDate: string;
    owner?: {
        firstName?: string;
        lastName?: string;
        profileImageUrl?: string;
    };
};

type Props = {
    onOpenDocument: (doc: {
        url: string;
        filename: string;
        title: string;
    }) => void;
};

function CalendarEvent({ event }: any) {
    const ownerName = event.owner
        ? `${event.owner.firstName || ""} ${event.owner.lastName || ""}`.trim() || "Unknown owner"
        : "No owner";

    return (
        <div className="relative group flex items-center justify-between gap-2 w-full">
            <span className="truncate">{event.title}</span>

            {event.owner?.profileImageUrl && (
                <img
                    src={event.owner.profileImageUrl}
                    alt="pfp"
                    className="w-5 h-5 rounded-full object-cover"
                />
            )}
        </div>
    );
}

function EventWrapper({ event, children }: any) {
    const ownerName = event?.owner
        ? `${event.owner.firstName || ""} ${event.owner.lastName || ""}`.trim() || "Unknown owner"
        : "No owner";

    return (
        <div title="">
            {children}
        </div>
    );
}

export default function ExpirationCalendarWidget({ onOpenDocument }: Props) {
    const [events, setEvents] = useState<any[]>([]);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH);

    useEffect(() => {
        async function loadData() {
            try {
                let expirations = [];
                let reviews = [];

                try {
                    const expRes = await fetch("http://localhost:3000/api/content/expirations", {
                        credentials: "include",
                    });
                    expirations = await expRes.json();
                } catch (e) {
                    console.error("Expirations failed:", e);
                }

                try {
                    const reviewRes = await fetch("http://localhost:3000/api/content-reviews", {
                        credentials: "include",
                    });
                    reviews = await reviewRes.json();
                } catch (e) {
                    console.error("Reviews failed:", e);
                }

                // 🔴 Expirations
                const expEvents = Array.isArray(expirations)
                    ? expirations.map((c: any) => ({
                        id: `exp-${c.id}`,
                        title: c.title,
                        start: new Date(c.expirationDate),
                        end: new Date(c.expirationDate),
                        allDay: true,
                        type: "expiration",
                        owner: c.owner,
                    }))
                    : [];

                // 🟡 Reviews
                const reviewEvents = Array.isArray(reviews)
                    ? reviews.map((r: any) => ({
                        id: `rev-${r.id}`,
                        title: `Review: ${r.stepName}`,
                        start: new Date(r.date),
                        end: new Date(r.date),
                        allDay: true,
                        type: "review",
                        owner: r.employee,
                    }))
                    : [];

                setEvents([...expEvents, ...reviewEvents]);

            } catch (err) {
                console.error("Calendar failed:", err);
            }
        }

        loadData();
    }, []);

    return (
        <>
            <CardTitle className="pl-0 pt-5">
                Content Expiration Calendar
            </CardTitle>

            <div className="w-full pt-5" style={{ height: "700px" }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    date={date}
                    view={view}
                    onNavigate={(newDate) => setDate(newDate)}
                    onView={(newView) => setView(newView)}
                    views={[Views.MONTH]}
                    defaultView="month"
                    style={{ height: "100%" }}

                    components={{
                        event: CalendarEvent,
                        eventWrapper: EventWrapper,
                    }}

                    eventPropGetter={(event: any) => {
                        let borderColor = "#EF4444"; // expiration default

                        if (event.type === "review") {
                            borderColor = "#FACC15"; // review = yellow
                        }

                        return {
                            title: "",
                            style: {
                                backgroundColor: "white",
                                color: "#111827",
                                border: "1px solid #E5E7EB",
                                borderLeft: `4px solid ${borderColor}`,
                                borderRadius: "8px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "pointer",
                            },
                        };
                    }}

                    onSelectEvent={async (event: any) => {
                        try {
                            const res = await fetch(
                                `${import.meta.env.VITE_BACKEND_URL}/api/content/${event.id}/download`,
                                { credentials: "include" }
                            );

                            if (!res.ok) return;

                            const data = await res.json();

                            if (data.url) {
                                onOpenDocument({
                                    url: data.url,
                                    filename: event.title,
                                    title: event.title,
                                });
                            }
                        } catch (err) {
                            console.error("Failed to open document:", err);
                        }
                    }}
                />
            </div>
        </>
    );
}