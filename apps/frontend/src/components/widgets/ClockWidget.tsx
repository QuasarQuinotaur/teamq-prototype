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

    //thars enough lol
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
    const [timezone, setTimezone] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );

    const [now, setNow] = useState(new Date());

    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        let t: any;
        if (running) {
            t = setInterval(() => setElapsed((e) => e + 10), 10);
        }
        return () => clearInterval(t);
    }, [running]);

    const clock = useMemo(() => formatTime(now, timezone), [now, timezone]);

    const ms = elapsed % 1000;
    const seconds = Math.floor(elapsed / 1000) % 60;
    const minutes = Math.floor(elapsed / 60000);

    return (
        <div className="flex flex-col h-full min-h-[420px] p-5 border rounded-lg bg-background">


            <div className="mb-3">
                <div className="text-sm text-muted-foreground">
                    World Clock
                </div>
            </div>

            {/* cock*/}
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
                        onClick={() => setRunning((r) => !r)}
                        className="px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
                    >
                        {running ? "Pause" : "Start"}
                    </button>

                    <button
                        onClick={() => {
                            setElapsed(0);
                            setRunning(false);
                        }}
                        className="px-3 py-1 rounded-md border hover:bg-muted transition"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}