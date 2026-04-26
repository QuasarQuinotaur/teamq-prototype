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

            <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1
                   opacity-0 group-hover:opacity-100
                   transition-opacity duration-150
                   bg-black text-white text-xs px-2 py-1 rounded
                   whitespace-nowrap z-50 pointer-events-none"
            >
                {ownerName}
            </div>
        </div>
    );
}

export default function ExpirationCalendarWidget({ onOpenDocument }: Props) {
    const [events, setEvents] = useState<any[]>([]);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH);

    useEffect(() => {
        fetch("http://localhost:3000/api/content/expirations", {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data: Expiration[]) => {
                const formatted = data.map((c) => {
                    const d = new Date(c.expirationDate);

                    return {
                        id: c.id,
                        title: c.title,
                        start: d,
                        end: d,
                        allDay: true,
                        owner: c.owner,
                    };
                });

                setEvents(formatted);
            })
            .catch((err) => {
                console.error("Failed to load expirations:", err);
            });
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
                    }}

                    eventPropGetter={() => ({
                        style: {
                            backgroundColor: "white",
                            color: "#111827",
                            border: "1px solid #E5E7EB",
                            borderLeft: "4px solid #EF4444",
                            borderRadius: "8px",
                            padding: "2px 8px",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                        },
                    })}

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