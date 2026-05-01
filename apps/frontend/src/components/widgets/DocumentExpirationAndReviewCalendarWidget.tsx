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

function CustomToolbar({ label, onNavigate }: any) {
    return (
        <div className="flex items-center justify-between pt-4 pb-2">
            {/* left: filters will be injected via parent */}
            <div id="calendar-filters" />

            {/* center: month label */}
            <div className="text-lg font-semibold">
                {label}
            </div>

            {/* right: navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => onNavigate("TODAY")}
                    className="px-3 py-1 rounded-md text-sm border bg-white"
                >
                    Today
                </button>
                <button
                    onClick={() => onNavigate("PREV")}
                    className="px-3 py-1 rounded-md text-sm border bg-white"
                >
                    Back
                </button>
                <button
                    onClick={() => onNavigate("NEXT")}
                    className="px-3 py-1 rounded-md text-sm border bg-white"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default function ExpirationCalendarWidget({ onOpenDocument }: Props) {
    // separate state for expirations and reviews
    const [expEvents, setExpEvents] = useState<any[]>([]);
    const [reviewEvents, setReviewEvents] = useState<any[]>([]);

    // filter state: all | exp | review
    const [filter, setFilter] = useState<"all" | "exp" | "review">("all");

    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH);

    const [showMoreEvents, setShowMoreEvents] = useState<any[]>([]);
    const [showMoreDate, setShowMoreDate] = useState<Date | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                let expirations = [];
                let reviews = [];

                try {
                    const expRes = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/content/expirations`,
                        {
                            credentials: "include",
                        },
                    );
                    expirations = await expRes.json();
                } catch (e) {
                    console.error("Expirations failed:", e);
                }

                // theres no endpoint for geting all reviews, need to get all content and access that attribute
                try {
                    const reviewRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reviews`, {
                        credentials: "include",
                    });
                    reviews = await reviewRes.json();
                } catch (e) {
                    console.error("Reviews failed:", e);
                }

                console.log("reviews:", reviews);

                // Expirations
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

                // Reviews
                const reviewEvents = Array.isArray(reviews)
                    ? reviews.map((r: any) => ({
                        id: `rev-${r.id}`,
                        reviewId: r.id,
                        title: `${r.content?.title || "Untitled"} (${r.stepName})`,
                        start: new Date(r.date),
                        end: new Date(r.date),
                        allDay: true,
                        type: "review",
                        owner: r.employee,
                    }))
                    : [];

                // store separately for filtering
                setExpEvents(expEvents);
                setReviewEvents(reviewEvents);

            } catch (err) {
                console.error("Calendar failed:", err);
            }
        }

        loadData();
    }, []);

    useEffect(() => {
        const container = document.getElementById("calendar-filters");
        const content = document.getElementById("calendar-filters-content");

        if (container && content && content.firstElementChild) {
            container.innerHTML = "";
            container.appendChild(content.firstElementChild);
        }
    }, [filter]);

    // compute filtered events based on selected filter
    const filteredEvents =
        filter === "all"
            ? [...expEvents, ...reviewEvents]
            : filter === "exp"
                ? expEvents
                : reviewEvents;

    return (
        <>
            <CardTitle className="pl-0 pt-5">
                Content Expirations & Reviews Calendar
            </CardTitle>

            <div id="calendar-filters-content" className="hidden">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-3 py-1 rounded-md text-sm border ${
                            filter === "all" ? "bg-gray-900 text-white" : "bg-white"
                        }`}
                    >
                        All
                    </button>

                    <button
                        onClick={() => setFilter("exp")}
                        className={`px-3 py-1 rounded-md text-sm border ${
                            filter === "exp" ? "bg-gray-900 text-white" : "bg-white"
                        }`}
                    >
                        Expirations
                    </button>

                    <button
                        onClick={() => setFilter("review")}
                        className={`px-3 py-1 rounded-md text-sm border ${
                            filter === "review" ? "bg-gray-900 text-white" : "bg-white"
                        }`}
                    >
                        Reviews
                    </button>
                </div>
            </div>

            <div className="w-full pt-5" style={{ height: "700px" }}>
                <Calendar
                    localizer={localizer}
                    events={filteredEvents}
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
                        toolbar: CustomToolbar,
                        event: CalendarEvent,
                        eventWrapper: EventWrapper,
                    }}

                    onShowMore={(events, date) => {
                        setShowMoreEvents(events);
                        setShowMoreDate(date);
                    }}

                    dayMaxRows={3}

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

            {showMoreDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-lg shadow-lg w-[400px] max-h-[500px] overflow-hidden">

                        {/* header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <div className="font-semibold text-sm">
                                {moment(showMoreDate).format("MMMM D, YYYY")}
                            </div>
                            <button
                                onClick={() => setShowMoreDate(null)}
                                className="text-sm px-2 py-1 border rounded"
                            >
                                Close
                            </button>
                        </div>

                        {/* event list */}
                        <div className="overflow-y-auto max-h-[400px] p-3 space-y-2">
                            {showMoreEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between rounded px-3 py-2 text-sm border bg-white hover:bg-gray-50 cursor-pointer"
                                    style={{
                                        border: "1px solid #E5E7EB",
                                        borderLeft: `4px solid ${
                                            event.type === "review" ? "#FACC15" : "#EF4444"
                                        }`,
                                    }}
                                >
                                    <span className="truncate">{event.title}</span>

                                    {event.owner?.profileImageUrl && (
                                        <img
                                            src={event.owner.profileImageUrl}
                                            className="w-5 h-5 rounded-full object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}