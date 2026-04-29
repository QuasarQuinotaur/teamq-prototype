import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import { cn } from '@/lib/utils';
import { WarningIcon } from '@phosphor-icons/react';

function DisclaimerBadge() {
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setExpanded(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className="fixed left-4 top-8 z-50"
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            <div className="flex h-10 items-center gap-2.5">
                <WarningIcon
                    weight="duotone"
                    className="size-8 shrink-0 text-white drop-shadow-sm"
                />
                <div
                    className={cn(
                        'flex flex-col overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out',
                        expanded ? 'max-w-[72rem] opacity-100' : 'max-w-0 opacity-0'
                    )}
                >
                    <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                        Disclaimer
                    </span>
                    <p className="text-xs leading-snug text-white/80">
                        This website has been created for WPI&apos;s CS 3733 Software
                        Engineering as a class project and is not in use by Hanover Insurance.
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeatureMediaFrame({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] bg-neutral-100 shadow-[0_32px_64px_-32px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.06]',
                className,
            )}
        >
            {children}
        </div>
    );
}

function FeaturePhoto({ src, alt }: { src: string; alt: string }) {
    return (
        <FeatureMediaFrame>
            <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </FeatureMediaFrame>
    );
}

function FeatureSection({
    eyebrow,
    title,
    description,
    media,
    reverse,
    className,
}: {
    eyebrow: string;
    title: string;
    description: string;
    media: React.ReactNode;
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
                    <div className={cn(reverse ? 'order-2 lg:order-1' : 'order-2')}>{media}</div>
                </div>
            </div>
        </section>
    );
}

function Home() {
    return (
        <div className="min-w-full bg-white text-lg">
            <DisclaimerBadge />
            <section className="flex min-h-[100svh] flex-col">
                <Hero className="min-h-0 flex-1" />
            </section>
            <FeatureSection
                eyebrow="Heritage"
                title="Strength that spans generations."
                description="Founded in 1852 in Manhattan, The Hanover Insurance Group has one of the longest and most respected records in property and casualty insurance. With over 170 years of experience, the company has built a reputation for resilience and reliability—fulfilling claim obligations through events like the Great Chicago Fire of 1871 and the 1906 San Francisco earthquake. Today, headquartered in Worcester, Massachusetts, The Hanover helps independent partner agents and policyholders prepare for and recover from the unexpected."
                media={
                    <FeaturePhoto
                        src="/home/heritage-city-hall.png"
                        alt="Hanover city hall at dusk reflected in calm water—a historic skyline at twilight."
                    />
                }
            />
            <FeatureSection
                eyebrow="Culture"
                title="CARE in every decision."
                description="The company’s culture is anchored by core CARE values—Collaboration, Accountability, Respect, and Empowerment—which drive technical excellence, innovative insurance solutions, and an inclusive environment for its 4,800 employees."
                media={
                    <FeaturePhoto
                        src="/home/care-collaboration.png"
                        alt="Diverse teammates collaborating around a conference table in a bright modern office"
                    />
                }
                reverse
                className="bg-neutral-50/80"
            />
            <FeatureSection
                eyebrow="Strategy"
                title="Protection for what matters most."
                description="As a premier property and casualty franchise, The Hanover leverages advanced data analytics and a people-first approach to protect the cars people drive, the businesses they own, and the places they call home."
                media={
                    <FeaturePhoto
                        src="/home/strategy-home-house.png"
                        alt="Craftsman-style home with porch and green lawn under a bright sky"
                    />
                }
            />
        </div>
    );
}

export default Home;
