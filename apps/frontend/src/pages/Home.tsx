import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { Badge } from '@/elements/badge';
import { Separator } from '@/elements/separator';
import { cn } from '@/lib/utils';

function ImagePlaceholder({ label }: { label: string }) {
    return (
        <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200/90 shadow-[0_32px_64px_-32px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.06]"
            role="img"
            aria-label={label}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_42%,rgba(255,255,255,0.9),transparent_65%)]" />
        </div>
    );
}

function FeatureSection({
    eyebrow,
    title,
    description,
    imageLabel,
    reverse,
    className,
}: {
    eyebrow: string;
    title: string;
    description: string;
    imageLabel: string;
    reverse?: boolean;
    className?: string;
}) {
    return (
        <section className={cn(className)}>
            <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32 lg:px-12">
                <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
                    <div
                        className={cn(
                            'flex flex-col gap-5 md:gap-6',
                            reverse ? 'order-1 lg:order-2' : 'order-1'
                        )}
                    >
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-sm">
                            {eyebrow}
                        </p>
                        <h2 className="font-heading text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                            {title}
                        </h2>
                        <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-relaxed">
                            {description}
                        </p>
                    </div>
                    <div
                        className={cn(
                            reverse ? 'order-2 lg:order-1' : 'order-2'
                        )}
                    >
                        <ImagePlaceholder label={imageLabel} />
                    </div>
                </div>
            </div>
        </section>
    );
}

function Home() {
    return (
        <div className="min-w-full bg-white text-lg">
            <section className="flex min-h-[100svh] flex-col">
                <section className="sticky top-0 z-30 border-b border-sky-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
                    <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3 text-center sm:px-6">
                        <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-hanover-blue">
                            Disclaimer
                        </span>
                        <p className="text-sm leading-relaxed text-sky-950/90">
                            This website has been created for WPI&apos;s CS 3733 Software Engineering as a class project and is not in use by Hanover Insurance.
                        </p>
                    </div>
                </section>
                <Hero className="min-h-0 flex-1" />
            </section>
            <FeatureSection
                eyebrow="Heritage"
                title="Strength that spans generations."
                description="Founded in 1852 in Manhattan, The Hanover Insurance Group has one of the longest and most respected records in property and casualty insurance. With over 170 years of experience, the company has built a reputation for resilience and reliability—fulfilling claim obligations through events like the Great Chicago Fire of 1871 and the 1906 San Francisco earthquake. Today, headquartered in Worcester, Massachusetts, The Hanover helps independent partner agents and policyholders prepare for and recover from the unexpected."
                imageLabel="Placeholder for heritage or company history imagery"
            />
            <FeatureSection
                eyebrow="Culture"
                title="CARE in every decision."
                description="The company’s culture is anchored by core CARE values—Collaboration, Accountability, Respect, and Empowerment—which drive technical excellence, innovative insurance solutions, and an inclusive environment for its 4,800 employees."
                imageLabel="Placeholder for team or workplace imagery"
                reverse
                className="bg-neutral-50/80"
            />
            <FeatureSection
                eyebrow="Strategy"
                title="Protection for what matters most."
                description="As a premier property and casualty franchise, The Hanover leverages advanced data analytics and a people-first approach to protect the cars people drive, the businesses they own, and the places they call home."
                imageLabel="Placeholder for technology or protection imagery"
            />
            <footer className="border-t border-border bg-gradient-to-b from-sky-50/40 to-white px-6 py-10 md:px-12 lg:px-16">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-3 rounded-md px-2 py-1 transition-colors hover:bg-muted/50"
                        >
                            <img src="/CombinationMark.png" alt="Hanover Insurance logo" className="h-9 w-auto object-contain" />
                        </Link>
                        <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
                            WPI CS 3733 Class Project
                        </Badge>
                    </div>
                    <Separator className="my-5 bg-border/70" />
                    <p className="text-center text-sm text-muted-foreground">
                        Built for educational use by WPI students. Not an official Hanover Insurance production application.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Home;
