import { cn } from "@/lib/utils.ts"
import { CardContainer, CardHeader, CardTitle, CardDescription } from "@/components/cards/Card.tsx"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import {
    SiPostgresql, SiExpress, SiReact, SiNodedotjs, SiTypescript,
    SiPrisma, SiSupabase,
    SiVite, SiTailwindcss, SiShadcnui, SiRadixui,
    SiLucide, SiPhosphoricons,
    SiThreedotjs,
    SiAuth0, SiAxios, SiCheerio,
    SiAnthropic,
    SiDotenv, SiDatefns, SiTanstack,
    SiGithub, SiNpm, SiMozilla, SiVercel, SiGooglefonts,
} from "@icons-pack/react-simple-icons"

type CreditItem = {
    name: string
    description: string
    url: string
    icon?: React.ReactNode
}

type CreditGroup = {
    heading: string
    items: CreditItem[]
}

const GROUPS: CreditGroup[] = [
    {
        heading: "Core Stack",
        items: [
            { name: "PostgreSQL",  description: "Relational database",               url: "https://www.postgresql.org",       icon: <SiPostgresql /> },
            { name: "Express.js",  description: "Backend web framework for Node.js", url: "https://expressjs.com",            icon: <SiExpress /> },
            { name: "React",       description: "Frontend UI library",               url: "https://react.dev",                icon: <SiReact /> },
            { name: "Node.js",     description: "JavaScript runtime",                url: "https://nodejs.org",               icon: <SiNodedotjs /> },
            { name: "TypeScript",  description: "Type-safe JavaScript",              url: "https://www.typescriptlang.org",   icon: <SiTypescript /> },
        ],
    },
    {
        heading: "Database & Storage",
        items: [
            { name: "Prisma",    description: "ORM and schema management",        url: "https://www.prisma.io",   icon: <SiPrisma /> },
            { name: "Supabase",  description: "Hosted Postgres and file storage", url: "https://supabase.com",    icon: <SiSupabase /> },
        ],
    },
    {
        heading: "Frontend Build",
        items: [
            { name: "Vite",         description: "Fast build tool and dev server",              url: "https://vite.dev",         icon: <SiVite /> },
            { name: "Tailwind CSS", description: "Utility-first CSS framework",                 url: "https://tailwindcss.com",  icon: <SiTailwindcss /> },
            { name: "shadcn/ui",    description: "Accessible component library built on Radix", url: "https://ui.shadcn.com",    icon: <SiShadcnui /> },
            { name: "Radix UI",     description: "Headless UI primitives for React",            url: "https://www.radix-ui.com", icon: <SiRadixui /> },
        ],
    },
    {
        heading: "UI & Components",
        items: [
            { name: "Lucide React",           description: "Clean open-source icon library",        url: "https://lucide.dev",                                icon: <SiLucide /> },
            { name: "Phosphor Icons",         description: "Flexible icon family for React",        url: "https://phosphoricons.com",                         icon: <SiPhosphoricons /> },
            { name: "Recharts",               description: "Composable charting library for React", url: "https://recharts.org",                              icon: <SiNpm /> },
            { name: "React Day Picker",       description: "Date picker component for React",       url: "https://daypicker.dev",                             icon: <SiNpm /> },
            { name: "TanStack Table",         description: "Headless table and data grid library",  url: "https://tanstack.com/table",                        icon: <SiTanstack /> },
            { name: "Sonner",                 description: "Toast notification component",          url: "https://sonner.emilkowal.ski",                      icon: <SiGithub /> },
            { name: "dnd-kit",                description: "Drag-and-drop toolkit for React",       url: "https://dndkit.com",                                icon: <SiNpm /> },
            { name: "react-resizable-panels", description: "Resizable split pane layouts",          url: "https://github.com/bvaughn/react-resizable-panels", icon: <SiGithub /> },
            { name: "React Confetti",         description: "Confetti animation component",          url: "https://github.com/alampros/react-confetti",        icon: <SiGithub /> },
        ],
    },
    {
        heading: "Document Handling",
        items: [
            { name: "PDF.js (pdfjs-dist)", description: "PDF rendering in the browser",           url: "https://mozilla.github.io/pdf.js",            icon: <SiMozilla /> },
            { name: "react-pdf",           description: "React wrapper for PDF.js",               url: "https://react-pdf.org",                        icon: <SiNpm /> },
            { name: "docx-preview",        description: "DOCX file preview in the browser",       url: "https://github.com/VolodymyrBaydalka/docxjs",  icon: <SiGithub /> },
            { name: "Mammoth",             description: "Converts DOCX files to HTML",            url: "https://github.com/mwilliamson/mammoth.js",    icon: <SiGithub /> },
            { name: "xlsx (SheetJS)",      description: "Excel file reading and writing",         url: "https://sheetjs.com",                          icon: <SiNpm /> },
            { name: "react-doc-viewer",    description: "Multi-format document viewer component", url: "https://github.com/Alcumus/react-doc-viewer",  icon: <SiGithub /> },
        ],
    },
    {
        heading: "3D & Visual",
        items: [
            { name: "Three.js",          description: "3D graphics library for the web", url: "https://threejs.org",                    icon: <SiThreedotjs /> },
            { name: "React Three Fiber", description: "React renderer for Three.js",     url: "https://docs.pmnd.rs/react-three-fiber", icon: <SiGithub /> },
            { name: "Drei",              description: "Helpers and abstractions for R3F", url: "https://github.com/pmndrs/drei",         icon: <SiGithub /> },
            { name: "OGL",               description: "Lightweight WebGL framework",      url: "https://github.com/oframe/ogl",          icon: <SiGithub /> },
        ],
    },
    {
        heading: "Auth & Networking",
        items: [
            { name: "Auth0",                  description: "Authentication and authorization platform",    url: "https://auth0.com",                               icon: <SiAuth0 /> },
            { name: "express-openid-connect", description: "Auth0 OpenID Connect middleware for Express",  url: "https://github.com/auth0/express-openid-connect", icon: <SiGithub /> },
            { name: "Axios",                  description: "HTTP client for the browser and Node.js",      url: "https://axios-http.com",                          icon: <SiAxios /> },
            { name: "Cheerio",                description: "HTML parsing for server-side scraping",        url: "https://cheerio.js.org",                          icon: <SiCheerio /> },
            { name: "Multer",                 description: "File upload middleware for Express",            url: "https://github.com/expressjs/multer",             icon: <SiGithub /> },
            { name: "Morgan",                 description: "HTTP request logger middleware",                url: "https://github.com/expressjs/morgan",             icon: <SiGithub /> },
            { name: "cors",                   description: "Cross-origin resource sharing middleware",      url: "https://github.com/expressjs/cors",               icon: <SiGithub /> },
        ],
    },
    {
        heading: "AI",
        items: [
            { name: "Anthropic SDK", description: "Claude AI integration for document summarization", url: "https://www.anthropic.com", icon: <SiAnthropic /> },
        ],
    },
    {
        heading: "Utilities",
        items: [
            { name: "date-fns",                description: "Modular date utility library",                  url: "https://date-fns.org",                           icon: <SiDatefns /> },
            { name: "math.js",                 description: "Extensive math library for JavaScript",         url: "https://mathjs.org",                             icon: <SiNpm /> },
            { name: "react-markdown",          description: "Markdown rendering component for React",        url: "https://github.com/remarkjs/react-markdown",     icon: <SiGithub /> },
            { name: "remark-gfm",              description: "GitHub Flavored Markdown plugin for remark",    url: "https://github.com/remarkjs/remark-gfm",         icon: <SiGithub /> },
            { name: "class-variance-authority",description: "Variant-based className management",            url: "https://cva.style",                              icon: <SiNpm /> },
            { name: "clsx",                    description: "Utility for constructing className strings",    url: "https://github.com/lukeed/clsx",                 icon: <SiGithub /> },
            { name: "tailwind-merge",          description: "Merges Tailwind CSS classes without conflicts", url: "https://github.com/dcastil/tailwind-merge",      icon: <SiGithub /> },
            { name: "react-error-boundary",    description: "React error boundary component",               url: "https://github.com/bvaughn/react-error-boundary", icon: <SiGithub /> },
            { name: "react-use",               description: "Collection of essential React hooks",          url: "https://github.com/streamich/react-use",         icon: <SiGithub /> },
            { name: "dotenv",                  description: "Loads environment variables from .env files",  url: "https://github.com/motdotla/dotenv",             icon: <SiDotenv /> },
        ],
    },
    {
        heading: "Fonts",
        items: [
            { name: "Geist",             description: "Variable sans-serif by Vercel",    url: "https://vercel.com/font",                                     icon: <SiVercel /> },
            { name: "Inter",             description: "Variable sans-serif typeface",      url: "https://rsms.me/inter",                                       icon: <SiGooglefonts /> },
            { name: "Libre Baskerville", description: "Variable serif typeface",           url: "https://fonts.google.com/specimen/Libre+Baskerville",         icon: <SiGooglefonts /> },
            { name: "Oxanium",           description: "Variable display typeface",         url: "https://fonts.google.com/specimen/Oxanium",                   icon: <SiGooglefonts /> },
            { name: "Roboto Slab",       description: "Variable slab serif typeface",      url: "https://fonts.google.com/specimen/Roboto+Slab",               icon: <SiGooglefonts /> },
            { name: "IBM Plex Serif",    description: "Serif typeface by IBM",             url: "https://www.ibm.com/plex",                                    icon: <SiNpm /> },
            { name: "VT323",             description: "Monospace retro pixel font",        url: "https://fonts.google.com/specimen/VT323",                     icon: <SiGooglefonts /> },
            { name: "Yantramanav",       description: "Humanist sans-serif typeface",      url: "https://fonts.google.com/specimen/Yantramanav",               icon: <SiGooglefonts /> },
        ],
    },
]

function CreditCard({ item }: { item: CreditItem }) {
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
            <CardContainer className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                        {item.icon}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">
                            {item.name}
                        </CardTitle>
                        <ArrowSquareOutIcon
                            className="mt-0.5 shrink-0 size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                    </div>
                    <CardDescription className="text-xs leading-snug">{item.description}</CardDescription>
                </CardHeader>
            </CardContainer>
        </a>
    )
}

const PERN_VARIANTS = [
    { label: "PostgreSQL", sub: "Database",          className: "bg-[#22C55E] text-white" },
    { label: "Express.js", sub: "Backend Framework", className: "bg-[#EF4444] text-white" },
    { label: "React",      sub: "Frontend Library",  className: "bg-[#FACC15] text-black" },
    { label: "Node.js",    sub: "Runtime",            className: "bg-[#5B8DB8] text-white" },
]

function PernBadge({ label, sub, className }: { label: string; sub: string; className: string }) {
    return (
        <div className={cn("rounded-xl px-6 py-4 text-center shadow-md", className)}>
            <p className="text-xl font-bold font-heading">{label}</p>
            <p className="text-xs opacity-70 mt-0.5">{sub}</p>
        </div>
    )
}

export default function Credits() {
    return (
        <div className="overflow-y-auto h-full">
            <div className="mx-auto max-w-5xl px-6 py-10 space-y-12">

                {/* Header */}
                <div className="space-y-2 text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">Built with</p>
                    <h1 className="text-3xl font-heading font-semibold">The PERN Stack</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                        This application is built on the <span className="text-foreground font-medium">PERN stack</span> —
                        a full-stack JavaScript framework combining PostgreSQL, Express.js, React, and Node.js —
                        alongside a wide range of open-source libraries and tools.
                    </p>
                </div>

                {/* PERN badges */}
                <div className="grid grid-cols-4 gap-4">
                    {PERN_VARIANTS.map((v) => (
                        <PernBadge key={v.label} label={v.label} sub={v.sub} className={v.className} />
                    ))}
                </div>

                {/* Credit groups */}
                {GROUPS.map((group) => (
                    <div key={group.heading} className="space-y-3">
                        <h2 className="text-base font-heading font-semibold border-b pb-2">{group.heading}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {group.items.map((item) => (
                                <CreditCard key={item.name} item={item} />
                            ))}
                        </div>
                    </div>
                ))}

            </div>
        </div>
    )
}