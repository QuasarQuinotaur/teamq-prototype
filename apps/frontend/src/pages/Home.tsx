import Confetti, { type ConfettiHandle } from '@/components/Confetti';
import Hero from '../components/Hero';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

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
    const confettiRef = useRef<ConfettiHandle>(null);

    return (
        <div className="min-w-full bg-white text-lg">
            <Hero />
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
            <Confetti ref={confettiRef} />
            <footer className="border-t border-border bg-gradient-to-b from-sky-50/40 to-white px-6 py-12 md:px-12 lg:px-16">
                <button
                    type="button"
                    onClick={() => confettiRef.current?.fire()}
                    className={cn(
                        'mx-auto flex w-full max-w-3xl flex-col gap-1 rounded-2xl border border-sky-200/90 bg-white/80 px-6 py-5 text-center shadow-sm',
                        'text-pretty text-sm leading-relaxed text-sky-950/90 transition',
                        'hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-md',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hanover-blue',
                        'cursor-pointer active:scale-[0.998]'
                    )}
                >
                    <span className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-hanover-blue">
                        Disclaimer
                    </span>
                    <span>
                        This website has been created for WPI&apos;s CS 3733 Software Engineering as a
                        class project and is not in use by Hanover Insurance.
                    </span>
                </button>
            </footer>
        </div>
    );
}

export default Home;
