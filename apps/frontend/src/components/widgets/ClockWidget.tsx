import { useEffect, useMemo, useState } from "react";

const TIMEZONES = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "Pacific/Honolulu",

    "America/Toronto",
    "America/Vancouver",
    "America/Edmonton",
    "America/Halifax",
    "America/St_Johns",

    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Rome",
    "Europe/Amsterdam",
    "Europe/Zurich",

    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Hong_Kong",
    "Asia/Singapore",
    "Asia/Dubai",
    "Asia/Kolkata",
];

function formatTime(date: Date, tz: string) {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(date);
}

function formatLabel(tz: string) {
    return tz.replace("_", " ");
}

export default function ClockWidget() {
    // timezone
    const [timezone, setTimezone] = useState(() => {
        return (
            localStorage.getItem("clock-timezone") ||
            Intl.DateTimeFormat().resolvedOptions().timeZone
        );
    });

    useEffect(() => {
        localStorage.setItem("clock-timezone", timezone);
    }, [timezone]);

    // cock
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const clock = useMemo(() => formatTime(now, timezone), [now, timezone]);
    //stop that watch
    const [running, setRunning] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [accumulated, setAccumulated] = useState(0);
    const [tick, setTick] = useState(Date.now());

    useEffect(() => {
        const t = setInterval(() => setTick(Date.now()), 50);
        return () => clearInterval(t);
    }, []);

    const elapsed =
        running && startTime
            ? accumulated + (tick - startTime)
            : accumulated;

    const ms = elapsed % 1000;
    const seconds = Math.floor(elapsed / 1000) % 60;
    const minutes = Math.floor(elapsed / 60000);

    function toggle() {
        if (running) {
            // pause
            if (startTime) {
                setAccumulated(accumulated + (Date.now() - startTime));
            }
            setStartTime(null);
            setRunning(false);
        } else {
            // start
            setStartTime(Date.now());
            setRunning(true);
        }
    }

    function reset() {
        setRunning(false);
        setStartTime(null);
        setAccumulated(0);
    }

    return (
        <div className="flex flex-col h-full min-h-[420px] p-5 border rounded-lg bg-background">

            {/* clock */}
            <div className="mb-3">
                <div className="text-sm text-muted-foreground">
                    World Clock
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-start">
                <div className="text-4xl font-bold tracking-tight">
                    {clock}
                </div>

                <div className="mt-3 w-full">
                    <select
                        className="w-full border rounded-md p-2 text-sm bg-background"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                    >
                        {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>
                                {formatLabel(tz)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* stopwatch */}
            <div className="mt-5 border-t pt-4">
                <div className="text-sm text-muted-foreground mb-1">
                    Stopwatch
                </div>

                <div className="text-2xl font-mono font-semibold">
                    {String(minutes).padStart(2, "0")}:
                    {String(seconds).padStart(2, "0")}:
                    {String(ms).padStart(3, "0")}
                </div>

                <div className="flex gap-2 mt-3">
                    <button
                        onClick={toggle}
                        className="px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
                    >
                        {running ? "Pause" : "Start"}
                    </button>

                    <button
                        onClick={reset}
                        className="px-3 py-1 rounded-md border hover:bg-muted transition"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}