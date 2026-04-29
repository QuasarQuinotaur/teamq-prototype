import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/elements/badge";
import { Separator } from "@/elements/separator";
import { cn } from "@/lib/utils";

const footerLinks = [
    { to: "/about", label: "About" },
    { to: "/credits", label: "Credits" },
] as const;

export function LandingFooter() {
    const { pathname } = useLocation();

    return (
        <footer className="border-t border-border/80 bg-gradient-to-b from-sky-50/50 to-white">
            <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 lg:px-12">
                <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/"
                            className="inline-flex w-fit items-center gap-2 rounded-md py-1 transition-opacity hover:opacity-90"
                        >
                            <img
                                src="/CombinationMark.png"
                                alt="Hanover Insurance logo"
                                className="h-9 w-auto object-contain"
                            />
                        </Link>
                        <Badge variant="secondary" className="w-fit px-2.5 py-0.5 text-xs">
                            WPI CS 3733 Class Project
                        </Badge>
                    </div>
                    <nav
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:justify-end"
                        aria-label="Footer"
                    >
                        {footerLinks.map((link, i) => (
                            <span key={link.to} className="inline-flex items-center gap-3">
                                {i > 0 && (
                                    <span className="text-muted-foreground/40 select-none" aria-hidden>
                                        ·
                                    </span>
                                )}
                                <Link
                                    to={link.to}
                                    className={cn(
                                        "rounded px-0.5 py-0.5 text-muted-foreground transition-colors hover:text-foreground",
                                        pathname === link.to && "font-medium text-foreground"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            </span>
                        ))}
                    </nav>
                </div>
                <Separator className="my-8 bg-border/60" />
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Built for educational use by WPI students. Not an official Hanover Insurance
                    production application.
                </p>
            </div>
        </footer>
    );
}
