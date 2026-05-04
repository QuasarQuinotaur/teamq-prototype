import { CardContainer, CardHeader, CardTitle, CardDescription } from "@/components/cards/Card.tsx"
import { LandingHomeLogoLink } from "@/components/LandingHomeLogoLink.tsx"
import { cn } from "@/lib/utils.ts"
import React from "react"

type TeamMember = {
    name: string
    position: string
    image?: string
    quote?: string
}

/** Hover or keyboard-focus on the avatar to swap photo ↔ quote (omit `quote` or blank = photo only). */
const TEAM_MEMBERS: TeamMember[] = [
    { name: "Ben Santana",      position: "Lead Software Engineer", image: "/team/bensantana.png", quote: "Happy Star Wars Day" },
    { name: "Daniel Gomes",     position: "Assistant Lead (Backend)", image: "/team/danielgomes.png", quote: "According to all known laws of aviation, there is no way a bee should be able to fly." },
    { name: "Ben Reinherz",     position: "Assistant Lead (Frontend)", image: "/team/benreinherz.png", quote: "" },
    { name: "Theron Boozer",    position: "Full-Time SWE (Frontend)", image: "/team/theronboozer.png", quote: <iframe
            src="https://tenor.com/embed/25993381"
            className="h-full w-full border-0"
            allowFullScreen
        /> },
    { name: "Norah Anderson",   position: "Full-Time SWE (Frontend)", image: "/team/norahanderson.png", quote: "Stay focused and secure the bag -DJ Khaled" },
    { name: "Ali Tariq",        position: "Full-Time SWE (Backend)", image: "/team/alitariq.jpg", quote: "" },
    { name: "Rashi Roselin",    position: "Documentation Lead", image: "/team/rashiroselin.png", quote: "That's baseball, Suzyn." },
    { name: "Kylie Welcher",    position: "Project Manager", image: "/team/kyliewelcher.png", quote: "We are not always what we seem, and hardly ever what we dream." },
    { name: "Abyshek Sukumar",  position: "Product Owner", image: "/team/abysheksukumar.png", quote: "404: Motivation not found" },
]

const ACCENT_COLORS = [
    "bg-rose-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-amber-500", "bg-sky-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500",
]

const AVATAR_SLOT_STATIC =
    "size-32 shrink-0 rounded-full border-4 border-background shadow-md"

/** Matches circle for square `size-32` (8rem); interpolates smoothly to `rounded-xl` unlike `rounded-full` (~9999px). */
const AVATAR_RADIUS_COLLAPSED = "rounded-[4rem]"

/** Width + radius only (height stays fixed). */
const AVATAR_EXPAND =
    "hover:w-56 hover:rounded-xl focus-visible:w-56 focus-visible:rounded-xl"

const QUOTE_SURFACE =
    "bg-zinc-950 text-zinc-100 [scrollbar-color:rgba(255,255,255,0.25)_transparent]"

function initials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function accentColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length]
}

/** Quote (and photo fade) waits `delay-[300ms]` so copy appears once expand `duration-300` finishes. */
function MemberAvatarWithQuote({ member, quote }: { member: TeamMember; quote: string }) {
    const radiusPhoto = cn(
        AVATAR_RADIUS_COLLAPSED,
        "transition-[border-radius] duration-300 ease-in-out group-hover:rounded-xl group-focus-visible:rounded-xl",
    )

    const photo = member.image ? (
        <img src={member.image} alt="" className={cn("size-full object-cover", radiusPhoto)} aria-hidden />
    ) : (
        <div
            className={cn(
                "flex size-full items-center justify-center text-4xl font-semibold text-white",
                radiusPhoto,
                accentColor(member.name),
            )}
            aria-hidden
        >
            {initials(member.name)}
        </div>
    )

    return (
        <button
            type="button"
            className={cn(
                "group relative z-0 shrink-0 overflow-hidden border-4 border-background shadow-md",
                AVATAR_RADIUS_COLLAPSED,
                "size-32",
                AVATAR_EXPAND,
                "ring-offset-background",
                "transition-[width,border-radius,box-shadow] duration-300 ease-in-out",
                "hover:z-20 hover:shadow-lg focus-visible:z-20 focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            aria-label={`${member.name}: ${quote}`}
        >
            <span
                className={cn(
                    "pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-150 ease-out delay-0",
                    "group-hover:opacity-0 group-hover:duration-200 group-hover:delay-[300ms]",
                    "group-focus-visible:opacity-0 group-focus-visible:duration-200 group-focus-visible:delay-[300ms]",
                )}
            >
                {photo}
            </span>
            <span
                className={cn(
                    "pointer-events-none absolute inset-0 flex items-center justify-center px-3 py-3 opacity-0 transition-opacity duration-150 ease-out delay-0",
                    "group-hover:opacity-100 group-hover:duration-200 group-hover:delay-[300ms]",
                    "group-focus-visible:opacity-100 group-focus-visible:duration-200 group-focus-visible:delay-[300ms]",
                    QUOTE_SURFACE,
                )}
            >
                <span className="max-h-full w-full overflow-y-auto overscroll-contain text-center text-base leading-snug [scrollbar-width:thin]">
                    <span aria-hidden className="text-zinc-500 not-italic">&ldquo;</span>
                    <span className="italic">{quote}</span>
                    <span aria-hidden className="text-zinc-500 not-italic">&rdquo;</span>
                </span>
            </span>
        </button>
    )
}

function MemberAvatarStatic({ member }: { member: TeamMember }) {
    if (member.image) {
        return <img src={member.image} alt={member.name} className={cn(AVATAR_SLOT_STATIC, "object-cover")} />
    }
    return (
        <div
            className={cn(
                "flex items-center justify-center text-4xl font-semibold text-white",
                AVATAR_SLOT_STATIC,
                accentColor(member.name),
            )}
            aria-hidden
        >
            {initials(member.name)}
        </div>
    )
}

function MemberCard({ member }: { member: TeamMember }) {
    const quote = member.quote ?? ""

    return (
        <CardContainer className="items-center overflow-visible pb-6 text-center w-full">
            <div className="flex justify-center pt-4">
                {quote ? (
                    <MemberAvatarWithQuote member={member} quote={quote} />
                ) : (
                    <MemberAvatarStatic member={member} />
                )}
            </div>
            <CardHeader className="text-center items-center w-full px-4">
                <CardTitle className="text-center w-full">{member.name}</CardTitle>
                <CardDescription className="text-center w-full">{member.position}</CardDescription>
            </CardHeader>
        </CardContainer>
    )
}

export default function About() {
    return (
        <div className="h-full min-h-0 w-full overflow-y-auto">
            <LandingHomeLogoLink />
            <div className="mx-auto max-w-5xl px-6 py-10 space-y-12">

                <div className="space-y-1 text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">WPI Computer Science Department</p>
                    <h1 className="text-3xl font-heading font-semibold">CS3733-D26 Software Engineering</h1>
                    <p className="text-muted-foreground">Prof. Wilson Wong</p>
                    <p className="text-muted-foreground">Team Coach: Keira Schoolcraft</p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-heading font-semibold text-center">Meet the Team</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {TEAM_MEMBERS.map((member) => (
                            <MemberCard key={member.name} member={member} />
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-8 space-y-4 text-center">
                    <h2 className="text-xl font-heading font-semibold">Special Thanks</h2>
                    <p className="text-muted-foreground">
                        We would like to thank <span className="text-foreground font-medium">Hanover Insurance</span> for
                        their support and partnership throughout this project.
                    </p>
                    <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                        <p><span className="text-foreground font-medium">Brandon Roche</span> — Deputy CIO</p>
                        <p><span className="text-foreground font-medium">Meaghan Jenket</span> — Principal Business Architect</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
