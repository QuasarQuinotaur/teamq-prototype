import { CardContainer, CardHeader, CardTitle, CardDescription } from "@/components/cards/Card.tsx"
import { cn } from "@/lib/utils.ts"

type TeamMember = {
    name: string
    position: string
    image?: string
}

const TEAM_MEMBERS: TeamMember[] = [
    { name: "Ben Santana",      position: "Lead Software Engineer" },
    { name: "Daniel Gomes",     position: "Assistant Lead (Backend)" },
    { name: "Ben Reinherz",     position: "Assistant Lead (Frontend)" },
    { name: "Theron Boozer",    position: "Full-Time SWE (Frontend)" },
    { name: "Norah Anderson",   position: "Full-Time SWE (Frontend)" },
    { name: "Ali Tariq",        position: "Full-Time SWE (Backend)", image: "/team/Ali Tariq.jpg" },
    { name: "Rashi Roselin",    position: "Documentation Lead" },
    { name: "Kylie Welcher",    position: "Project Manager" },
    { name: "Abushek Sukumar",  position: "Product Owner" },
]

const ACCENT_COLORS = [
    "bg-rose-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-amber-500", "bg-sky-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500",
]

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

function MemberCard({ member }: { member: TeamMember }) {
    const avatarFrame = "h-28 w-28 rounded-full border-4 border-background shadow-md object-cover"

    return (
        <CardContainer className="items-center pb-6 text-center w-full">
            <div className="flex justify-center pt-4">
                {member.image ? (
                    <img src={member.image} alt={member.name} className={avatarFrame} />
                ) : (
                    <div
                        className={cn(
                            "flex items-center justify-center text-4xl font-semibold text-white",
                            avatarFrame,
                            accentColor(member.name),
                        )}
                        aria-hidden
                    >
                        {initials(member.name)}
                    </div>
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
        <div className="overflow-y-auto h-full">
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