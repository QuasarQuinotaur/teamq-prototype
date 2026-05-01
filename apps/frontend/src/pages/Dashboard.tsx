import {
    DndContext,
    closestCenter,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import {
    SortableContext,
    useSortable,
    arrayMove,
    rectSortingStrategy,
} from "@dnd-kit/sortable";

import StatsWidget from "@/components/widgets/RequestsStatsCardWidget.tsx";
import CalendarWidget from "@/components/widgets/RequestsCalendarWidget.tsx";
import RequestsWidget from "@/components/widgets/RequestsListWidget.tsx";

import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { addDays, startOfDay } from "date-fns";
import { Plus, GripVertical, Trash2, ChevronDown, Info } from "lucide-react";
import PieChartWidget from "@/components/widgets/PieChartWidget.tsx";
import GifWidget from "@/components/widgets/GifWidget.tsx";
import DocumentExpirationLineWidget from "@/components/widgets/DocumentExpirationLineWidget.tsx";
import DocumentExpirationCalendarWidget from "@/components/widgets/DocumentExpirationAndReviewCalendarWidget.tsx";
import TopDocumentActivityWidget from "@/components/widgets/TopDocumentAcivityWidget.tsx";
import ContentCurrencyWidget from "@/components/widgets/ContentCurrencyWidget.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";
import type { WorkflowPayload } from "@/components/service-requests/workflowTypes.ts";
import {
    allEmployeeIdsFromWorkflow,
    enrichWorkflowForList,
    type WorkflowListRow,
} from "@/components/service-requests/workflowTypes.ts";
import ActivityChartWidget from "@/components/widgets/ActivityChartWidget.tsx";
import ActivityFeedWidget from "@/components/widgets/ActivityFeedWidget.tsx";

type Widget = {
    id: string;
    type: string;
    size: 1 | 2 | 3;
    url?: string;
};


type ServiceRequestRow = WorkflowListRow;

const base = `${import.meta.env.VITE_BACKEND_URL}/api`;

const WIDGET_INFO_TEXT: Record<string, string> = {
    progressStatsCard:
        "Shows counts of your assigned service requests: to do, overdue, due this week, and completed. Each stat links to a filtered view of requests.",
    requestsCalendar:
        "Shows a week view of your assigned service requests placed on their due dates so you can see what is coming up.",
    requestsList:
        "Lists your assigned requests in tabs by status—overdue, due this week, and other upcoming work—with links to each request.",
    progressPieChart:
        "Shows a pie chart of how your assigned requests split across done, overdue, due this week, and upcoming work.",
    expirationLine:
        "Plots how many documents expire on each day over the next 30 days, using content expiration dates from the library.",
    expirationCalendar:
        "Calendar of document expirations and review-related dates from your content catalog.",
    contentCurrency:
        "Summarizes how fresh your documents are by last updated date: current (under 30 days), review soon (30–90 days), and outdated (over 90 days).",
    topDocumentActivity:
        "Ranks documents by combined views and downloads so you can see which content gets the most attention.",
    activityChart:
        "Charts how much activity occurred over time; switch the range to day, week, month, or year.",
    activityFeed:
        "Lists recent library activity—documents added, updated, viewed, or deleted—with who did what and when. Filter by event type.",
    gif:
        "Displays an animated GIF from the URL you chose when adding the widget, or a default embed if no GIF URL is set.",
};

const DEFAULT_WIDGET_INFO =
    "This dashboard tile shows information from Hanover. Remove it from the grip menu if you no longer need it.";

function getDefaultWidgets(jobPosition: string): Widget[] {
    const base: { type: string; size: 1 | 2 | 3 }[] =
        jobPosition === "admin"
            ? [
                { type: "contentCurrency", size: 1 },
                { type: "activityChart", size: 2 },
                { type: "topDocumentActivity", size: 1 },
                { type: "expirationCalendar", size: 3},
            ]
            : jobPosition === "underwriter"
                ? [
                    { type: "progressStatsCard", size: 1 },
                    { type: "requestsCalendar", size: 2 },
                    { type: "expirationCalendar", size: 3 },
                ]
                : jobPosition === "businessAnalyst"
                    ? [
                        { type: "progressPieChart", size: 1 },
                        { type: "requestsCalendar", size: 2 },
                        { type: "requestsCalendar", size: 3 },
                    ]
                    : [
                        { type: "progressPieChart", size: 1 },
                        { type: "requestsList", size: 2 },
                        { type: "requestsCalendar", size: 3 },
                    ];

    return base.map((w, i) => ({
        ...w,
        id: `${w.type}-${i}-${Date.now()}`,
    }));
}

function migrateWidgetsFromStorage(parsed: Widget[]): Widget[] {
    return parsed.map((w) =>
        w.type === "userActivity" ? { ...w, type: "activityChart" } : w
    );
}

export default function Dashboard() {

    const [user, setUser] = useState<any>(null);
    const [jobPosition, setJobPosition] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${base}/me`, {
                    credentials: "include",
                });
                const data = await res.json();
                setUser(data);
                setJobPosition(data.jobPosition);
            } catch (err) {
                console.error("Failed to fetch user", err);
            }
        };

        fetchUser();
    }, []);

    const [widgets, setWidgets] = useState<Widget[]>([]);

    useEffect(() => {
        if (!jobPosition || !user) return;

        const storageKey = `dashboard-widgets-${user.id}`;
        const saved = localStorage.getItem(storageKey);

        if (saved) {
            try {
                setWidgets(migrateWidgetsFromStorage(JSON.parse(saved)));
            } catch {
                setWidgets(getDefaultWidgets(jobPosition));
            }
        } else {
            setWidgets(getDefaultWidgets(jobPosition));
        }
    }, [jobPosition, user]);

    useEffect(() => {
        if (!widgets.length || !user) return;

        const storageKey = `dashboard-widgets-${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(widgets));
    }, [widgets, user]);

    const widgetOptions = [
        { type: "progressStatsCard", label: "Requests (Stats) " },
        { type: "requestsCalendar", label: "Requests (Calendar) " },
        { type: "requestsList", label: "Requests (List) " },
        { type: "progressPieChart", label: "Progress (Chart) " },
        { type: "expirationLine", label: "Content Expirations (Chart) " },
        { type: "expirationCalendar", label: "Content Expirations & Reviews (Calendar) " },
        { type: "contentCurrency", label: "Content Currency" },
        { type: "topDocumentActivity", label: "Top Document Activity (Leaderboard) " },
        { type: "activityChart", label: "User Activity (Chart)" },
        { type: "activityFeed", label: "Activity Feed (List)" },
        { type: "gif", label: "GIF" },
    ];

    const [requests, setRequests] = useState<ServiceRequestRow[]>([]);
    const [contentItems, setContentItems] = useState<
        { id: number; title: string; expirationDate: string }[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [userFirstName, setUserFirstName] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;

    const nodeRefs    = useRef<Map<string, HTMLElement>>(new Map());
    const frozenRects = useRef<Map<string, ClientRect>>(new Map());

    const displayWidgets = useMemo(() => {
        if (!activeId || !overId || activeId === overId) return widgets;
        const oi = widgets.findIndex(w => w.id === activeId);
        const ni = widgets.findIndex(w => w.id === overId);
        if (oi === -1 || ni === -1) return widgets;
        return arrayMove(widgets, oi, ni);
    }, [widgets, activeId, overId]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [openPreview, setOpenPreview] = useState<string | null>(null);


    useEffect(() => {
        Promise.all([
            fetch(`${base}/me`, { credentials: "include" }).then(res => res.json()),
            fetch(`${base}/servicereqs/assigned/0`, { credentials: "include" }).then(res =>
                res.ok ? res.json() : []
            ),
            fetch(`${base}/content`, { credentials: "include" }).then(res =>
                res.ok ? res.json() : []
            ),
        ])
            .then(([me, data, content]) => {
                const meRow = me as { id: number; firstName?: string | null } | undefined;
                setUserFirstName(meRow?.firstName?.trim() || null);
                const raw = Array.isArray(data) ? (data as WorkflowPayload[]) : [];
                const rows = raw.map(enrichWorkflowForList);
                setRequests(rows.filter((r) => allEmployeeIdsFromWorkflow(r.stages).has(me.id)));
                setContentItems(
                    Array.isArray(content)
                        ? content.map(c => ({
                              id: c.id,
                              title: c.title,
                              expirationDate: c.expirationDate,
                          }))
                        : []
                );
            })
            .catch(() => {
                setUserFirstName(null);
                setRequests([]);
                setContentItems([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const today = startOfDay(new Date());
    const weekEnd = startOfDay(addDays(today, 6));

    const {
        counts,
        yourRequestsList,
        overdueList,
        dueWeekList,
        todoList,
    } = useMemo(() => {
        let overdue = 0, dueWeek = 0, todo = 0, done = 0;

        const your: ServiceRequestRow[] = [];
        const overdueArr: ServiceRequestRow[] = [];
        const weekArr: ServiceRequestRow[] = [];
        const todoArr: ServiceRequestRow[] = [];

        for (const r of requests) {
            if (r.status === "done") {
                done++;
                continue;
            }

            your.push(r);
            const due = r.dateDue ? new Date(r.dateDue) : null;

            if (due && due < today) {
                overdue++; overdueArr.push(r);
            } else if (due && due <= weekEnd) {
                dueWeek++; weekArr.push(r);
            } else {
                todo++; todoArr.push(r);
            }
        }

        return {
            counts: { todo, overdue, dueWeek, done },
            yourRequestsList: your,
            overdueList: overdueArr,
            dueWeekList: weekArr,
            todoList: todoArr,
        };
    }, [requests]);

    function registerNode(id: string, el: HTMLElement | null) {
        if (el) nodeRefs.current.set(id, el);
        else nodeRefs.current.delete(id);
    }

    const customCollision = useCallback((args: any) => {
        if (!frozenRects.current.size) return closestCenter(args);
        const fixedRects = new Map(args.droppableRects);
        args.droppableContainers.forEach((c: any) => {
            const r = frozenRects.current.get(c.id);
            if (r) fixedRects.set(c.id, r);
        });
        return closestCenter({ ...args, droppableRects: fixedRects });
    }, []);

    function handleDragStart(event: any) {
        const id = event.active.id;
        setActiveId(id);
        setOverId(id);
        // Snapshot widget rects so collision detection stays stable while DOM reorders.
        const frozen = new Map<string, ClientRect>();
        nodeRefs.current.forEach((el, wId) => {
            const r = el.getBoundingClientRect();
            frozen.set(wId, { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height, x: r.x, y: r.y, toJSON: () => r.toJSON() });
        });
        frozenRects.current = frozen;
    }

    function handleDragOver(event: any) {
        const newId = event.over?.id ?? null;
        if (!newId) return;
        setOverId(prev => (prev === newId ? prev : newId));
    }

    function handleDragEnd(event: any) {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);
        frozenRects.current.clear();
        if (!over || active.id === over.id) return;

        // displayWidgets already has the correct final order.
        setWidgets(displayWidgets);
    }

    function handleDragCancel() {
        setActiveId(null);
        setOverId(null);
        frozenRects.current.clear();
    }

    function addWidget(type: string, size?: 1 | 2 | 3, url?: string) {
        const id = crypto.randomUUID();

        const defaultSizes: Record<string, 1 | 2 | 3> = {
            progressStatsCard: 1,
            progressPieChart: 1,
            requestsCalendar: 2,
            requestsList: 2,
            expirationLine: 3,
            expirationCalendar: 3,
            activityFeed: 2,
            gif: 1,
        };

        setWidgets(prev => [
            ...prev,
            {
                id,
                type,
                size: size || defaultSizes[type] || 1,
                url,
            },
        ]);
    }

    function removeWidget(id: string) {
        setWidgets(prev => prev.filter(w => w.id !== id));
    }

    return (
        <>
            <div className="grid grid-cols-3 items-center px-6 py-4">
                <div />
                <div className="flex items-center justify-center gap-2 min-w-0">
                    {loading ? (
                        <Skeleton
                            className="h-8 w-[min(280px,85vw)] shrink-0"
                            aria-hidden
                        />
                    ) : (
                        <h1 className="text-2xl font-heading text-center truncate">
                            {userFirstName
                                ? `Hello, ${userFirstName}`
                                : "Hello, there"}
                        </h1>
                    )}
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card hover:bg-muted"
                    >
                        <Plus className="size-4" />
                    </button>
                </div>
            </div>

            <div className="min-h-screen*2 overflow-y-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={customCollision}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext items={displayWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
                        <div className="flex flex-wrap gap-4 px-6 pb-6 items-stretch min-h-0">
                            {displayWidgets.map(widget => (
                                <SortableItem
                                    key={widget.id}
                                    id={widget.id}
                                    size={widget.size}
                                    tall={widget.type === "expirationCalendar"}
                                    widgetType={widget.type}
                                    widgetTitle={
                                        widgetOptions.find(w => w.type === widget.type)?.label.trim() ??
                                        "Widget"
                                    }
                                    onDelete={removeWidget}
                                    isActive={widget.id === activeId}
                                    isDraggingAny={activeId !== null}
                                    registerNode={registerNode}
                                >
                                    <WidgetRenderer
                                        type={widget.type}
                                        data={{
                                            loading,
                                            requests,
                                            counts,
                                            yourRequestsList,
                                            overdueList,
                                            dueWeekList,
                                            todoList,
                                            today,
                                            weekEnd,
                                            contentForExpiration: contentItems,
                                        }}
                                        url={widget.url}
                                    />
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay dropAnimation={null}>
                        {activeWidget ? (
                            <div
                                className={`flex-none relative pb-8 rounded-lg border bg-card mb-2 shadow-2xl opacity-90 cursor-grabbing ${
                                    activeWidget.type === "expirationCalendar"
                                        ? "min-h-[616px]"
                                        : "min-h-[300px]"
                                } ${
                                    activeWidget.size === 3
                                        ? "w-full"
                                        : activeWidget.size === 2
                                            ? "w-[calc(66.666%-1rem)]"
                                            : "w-[calc(33.333%-1rem)]"
                                }`}
                            >
                                <div className="flex items-center justify-between px-3 py-2 border-b">
                                    <GripVertical className="size-4 opacity-50" />
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-card rounded-lg max-h-[85vh] w-[min(1100px,90vw)] overflow-y-auto p-4">
                        <div className="flex justify-between items-center gap-3 mb-4">
                            <div className="flex items-center gap-2 min-w-0">
                                <h2 className="m-0 border-b-0 pb-0 text-lg font-semibold leading-none">
                                    Add Widget
                                </h2>
                                <HelpHint contentClassName="max-w-sm">
                                    Expand a widget type to preview it, then choose a size. Some types offer small,
                                    medium, or large widths; charts and stats default to a compact tile.
                                </HelpHint>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setOpenPreview(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            {widgetOptions.map(w => (
                                <div key={w.type} className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() =>
                                            setOpenPreview(prev => prev === w.type ? null : w.type)
                                        }
                                        className="w-full text-left px-4 py-3 hover:bg-muted flex justify-between items-center"
                                    >
                                        <span className="font-medium">{w.label}</span>
                                        <ChevronDown
                                            className={`size-4 transition-transform duration-200 ${
                                                openPreview === w.type ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    {openPreview === w.type && (
                                        <div className="p-4 border-t space-y-4 bg-muted/30">

                                            <div className="border rounded-lg bg-card min-h-[100px] overflow-hidden">
                                                <div className="p-4 h-full flex flex-col">
                                                    <div className="flex-1 [&>div]:h-full [&>div]:!h-full">
                                                        <WidgetRenderer
                                                            type={w.type}
                                                            data={{
                                                                loading: false,
                                                                requests: [],
                                                                counts: { todo: 3, overdue: 1, dueWeek: 2, done: 4 },
                                                                yourRequestsList: [],
                                                                overdueList: [],
                                                                dueWeekList: [],
                                                                todoList: [],
                                                                today: new Date(),
                                                                weekEnd: new Date(),
                                                                contentForExpiration: [],
                                                            }}
                                                            url="https://tenor.com/view/twerken-twerk-duck-maincord-gif-25993381"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {w.type === "gif" ? (
                                                <button
                                                    onClick={() => {
                                                        addWidget(
                                                            "gif",
                                                            1,
                                                            "https://media.tenor.com/mGgWY8RkgYMAAAAC/duck-twerk.gif"
                                                        );
                                                        setShowAddModal(false);
                                                        setOpenPreview(null);
                                                    }}
                                                    className="w-full bg-primary text-white rounded-md py-2 hover:opacity-90 transition"
                                                >
                                                    Add GIF (Small)
                                                </button>
                                            ) : w.type === "expirationLine" ? (
                                                <button
                                                    onClick={() => {
                                                        addWidget("expirationLine", 3);
                                                        setShowAddModal(false);
                                                        setOpenPreview(null);
                                                    }}
                                                    className="w-full bg-primary text-white rounded-md py-2 hover:opacity-90 transition"
                                                >
                                                    Add {w.label} (Large)
                                                </button>
                                            ) : w.type === "expirationCalendar" ? (
                                                <button
                                                    onClick={() => {
                                                        addWidget("expirationCalendar", 3);
                                                        setShowAddModal(false);
                                                        setOpenPreview(null);
                                                    }}
                                                    className="w-full bg-primary text-white rounded-md py-2 hover:opacity-90 transition"
                                                >
                                                    Add {w.label} (Large)
                                                </button>
                                            ) : (w.type === "progressStatsCard"
                                                || w.type === "progressPieChart"
                                                || w.type === "topDocumentActivity"
                                                || w.type === "contentCurrency") ? (
                                                <button
                                                    onClick={() => {
                                                        addWidget(w.type, 1);
                                                        setShowAddModal(false);
                                                        setOpenPreview(null);
                                                    }}
                                                    className="w-full bg-primary text-white rounded-md py-2 hover:opacity-90 transition"
                                                >
                                                    Add {w.label} (Small)
                                                </button>
                                            ) : w.type === "activityChart" || w.type === "activityFeed" ? (
                                                <div className="flex gap-2">

                                                    <button
                                                        onClick={() => {
                                                            addWidget(w.type, 2);
                                                            setShowAddModal(false);
                                                            setOpenPreview(null);
                                                        }}
                                                        className="flex-1 bg-primary text-white rounded-md py-2 hover:opacity-90 transition"
                                                    >
                                                        Add {w.label} (Medium)
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            addWidget(w.type, 3);
                                                            setShowAddModal(false);
                                                            setOpenPreview(null);
                                                        }}
                                                        className="flex-1 bg-primary text-white rounded-md py-2 hover:opacity-90 transition"
                                                    >
                                                        Add {w.label} (Large)
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            addWidget(w.type, 2);
                                                            setShowAddModal(false);
                                                            setOpenPreview(null);
                                                        }}
                                                        className="flex-1 bg-primary text-white rounded-md py-2 hover:opacity-90 transition"
                                                    >
                                                        Add {w.label} (Medium)
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            addWidget(w.type, 3);
                                                            setShowAddModal(false);
                                                            setOpenPreview(null);
                                                        }}
                                                        className="flex-1 bg-primary text-white rounded-md py-2 hover:opacity-90 transition"
                                                    >
                                                        Add {w.label} (Large)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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

function SortableItem({
    id,
    size,
    tall,
    children,
    widgetType,
    widgetTitle,
    onDelete,
    isActive,
    isDraggingAny,
    registerNode,
}: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const [menuOpen, setMenuOpen] = useState(false);
    const [infoHover, setInfoHover] = useState(false);
    const dragStartPos = useRef<{ x: number; y: number } | null>(null);
    const didDrag = useRef(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu if a drag starts
    useEffect(() => {
        if (isDraggingAny) {
            setMenuOpen(false);
            setInfoHover(false);
        }
    }, [isDraggingAny]);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        function handleOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
                setInfoHover(false);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [menuOpen]);

    // Suppress all transforms during drag — displacement is handled by DOM reorder
    // (displayWidgets) so no transforms are needed and they would conflict.
    const style = isDraggingAny
        ? {}
        : { transform: CSS.Transform.toString(transform), transition };

    const widthClass =
        size === 3
            ? "w-full"
            : size === 2
                ? "w-[calc(66.666%-1rem)]"
                : "w-[calc(33.333%-1rem)]";

    const minHeightClass = tall ? "min-h-[616px]" : "min-h-[300px]";

    function handleGripPointerDown(e: React.PointerEvent) {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        didDrag.current = false;
        listeners?.onPointerDown?.(e);
    }

    function handleGripPointerMove(e: React.PointerEvent) {
        if (dragStartPos.current) {
            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;
            if (Math.sqrt(dx * dx + dy * dy) > 5) didDrag.current = true;
        }
    }

    function handleGripPointerUp() {
        if (!didDrag.current) {
            setInfoHover(false);
            setMenuOpen(prev => !prev);
        }
        dragStartPos.current = null;
    }

    return (
        <div
            ref={(el) => { setNodeRef(el); registerNode(id, el); }}
            style={style}
            {...attributes}
            className={`group ${widthClass} flex-none relative ${minHeightClass} mb-2 ${
                isActive ? "opacity-0" : ""
            }`}
        >
            {/* floating grip — show on card hover; stay visible while menu is open so it does not vanish between grip and dropdown */}
            <div
                className={`absolute top-2 left-2 z-20 transition-opacity ${
                    menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                ref={menuRef}
            >
                <div
                    {...listeners}
                    onPointerDown={handleGripPointerDown}
                    onPointerMove={handleGripPointerMove}
                    onPointerUp={handleGripPointerUp}
                    className="cursor-grab rounded p-0.5 hover:bg-muted"
                >
                    <GripVertical className="size-4 text-muted-foreground" />
                </div>
                {menuOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 min-w-[130px] overflow-visible rounded-lg border bg-popover py-1 text-popover-foreground shadow-md">
                        <div
                            className="relative"
                            onMouseEnter={() => setInfoHover(true)}
                            onMouseLeave={() => setInfoHover(false)}
                        >
                            <div
                                className={`flex cursor-help items-center gap-2 px-3 py-1.5 text-sm ${
                                    infoHover ? "bg-muted" : ""
                                }`}
                            >
                                <Info className="size-3.5 shrink-0" />
                                Info
                            </div>
                            {infoHover && (
                                <div
                                    className="pointer-events-auto absolute left-full top-0 z-[60] ml-2 max-h-[min(20rem,70vh)] w-[min(19rem,calc(100vw-3rem))] overflow-y-auto rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-lg before:pointer-events-auto before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-['']"
                                >
                                    <div className="text-sm font-medium leading-snug">{widgetTitle}</div>
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                        {WIDGET_INFO_TEXT[widgetType] ?? DEFAULT_WIDGET_INFO}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="my-1 h-px bg-border" role="presentation" />
                        <button
                            type="button"
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                            onClick={() => {
                                onDelete(id);
                                setMenuOpen(false);
                                setInfoHover(false);
                            }}
                        >
                            <Trash2 className="size-3.5" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="h-full flex flex-col">
                {children}
            </div>
        </div>
    );
}


function WidgetRenderer({ type, data, url }: { type: string; data: any; url?: string }) {

    let inner: React.ReactNode;
    switch (type) {
        case "progressStatsCard":    inner = <StatsWidget counts={data.counts} loading={data.loading} />; break;
        case "requestsList": inner = <RequestsWidget {...data} />; break;
        case "progressPieChart":    inner = <PieChartWidget counts={data.counts} loading={data.loading} />; break;
        case "expirationLine": inner = (
            <DocumentExpirationLineWidget
                items={data.contentForExpiration ?? []}
                loading={data.loading}
            />
        ); break;
        case "requestsCalendar": inner = <CalendarWidget requests={data.requests} loading={data.loading} />; break;
        case "expirationCalendar": inner = (
            <DocumentExpirationCalendarWidget
                onOpenDocument={() => {}}
            />
        ); break;
        case "topDocumentActivity": inner = <TopDocumentActivityWidget/>; break;
        case "activityChart": inner = <ActivityChartWidget/>; break;
        case "activityFeed": inner = <ActivityFeedWidget />; break;
        case "contentCurrency": inner = <ContentCurrencyWidget />; break;
        case "gif":      inner = <GifWidget url={url} />; break;
        default:         inner = <div>Unknown widget</div>;
    }

    return (
        <div className="h-full p-4 bg-white rounded-2xl shadow-sm">
            {inner}
        </div>
    );
}