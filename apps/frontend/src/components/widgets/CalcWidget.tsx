import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/cards/Card.tsx";

const buttons = [
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "0", ".", "=", "+",
    "C"
];

export default function CalculatorWidget() {
    const [input, setInput] = useState("");
    const [result, setResult] = useState<string | null>(null);

    function handleClick(value: string) {
        if (value === "C") {
            setInput("");
            setResult(null);
            return;
        }

        if (value === "=") {
            try {
                const evalResult = Function(`"use strict"; return (${input})`)();
                setResult(String(evalResult));
            } catch {
                setResult("Error");
            }
            return;
        }

        setInput(prev => prev + value);
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <CardHeader className="shrink-0 pb-2">
                <CardTitle>Calculator</CardTitle>
                <p className="text-sm text-muted-foreground-200">
                    Basic arithmetic operations
                </p>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 flex flex-col gap-3">

                {/* Display */}
                <div className="rounded-lg bg-background border p-3 h-[84px] flex flex-col justify-center">

                    <div className="text-sm text-muted-foreground-200 break-all line-clamp-2">
                        {input || "0"}
                    </div>

                    {/* space for result */}
                    <div className="text-lg font-semibold text-foreground/70 h-[28px] leading-tight">
                        {result !== null ? `= ${result}` : ""}
                    </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-4 gap-2 flex-1">
                    {buttons.map((btn) => (
                        <button
                            key={btn}
                            onClick={() => handleClick(btn)}
                            className={`
                                rounded-md px-2 py-2 text-sm transition
                                ${btn === "="
                                ? "bg-primary text-primary-foreground hover:opacity-90"
                                : btn === "C"
                                    ? "bg-danger text-white hover:opacity-90 col-span-4"
                                    : "bg-muted hover:bg-muted/70"
                            }
                            `}
                        >
                            {btn}
                        </button>
                    ))}
                </div>
            </CardContent>
        </div>
    );
}