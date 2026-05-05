import { setInboxTutorialSession } from "@/components/tutorial/inboxTutorialStorage.ts";
import { setServiceRequestTutorialSession } from "@/components/tutorial/serviceRequestTutorialStorage.ts";
import { HelpHint } from "@/elements/help-hint.tsx";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import { cn } from "@/lib/utils.ts";
import {
  ArrowRightIcon,
  BellSimpleIcon,
  ClipboardTextIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const cardClassName = cn(
  "group relative flex h-full min-h-[220px] flex-col rounded-2xl border border-border bg-card p-6 shadow-sm",
  "transition-[border-color,box-shadow] duration-200",
  "hover:border-primary/40 hover:shadow-md",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

type TutorialCardLinkProps = {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
};

function TutorialCardLink({
  to,
  title,
  description,
  icon,
  onClick,
}: TutorialCardLinkProps) {
  return (
    <Link to={to} onClick={onClick} className={cardClassName}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
        <span className="group-hover:underline">Start</span>
        <ArrowRightIcon
          className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          weight="bold"
          aria-hidden
        />
      </div>
    </Link>
  );
}

export default function Tutorials() {
  return (
    <div className="bg-muted/50 flex min-h-0 flex-1 flex-col overflow-auto rounded-xl">
      <header className="flex h-16 shrink-0 items-center px-4">
        <SidebarTrigger className="-ml-1 shrink-0" />
      </header>
      <div className="mx-auto w-full max-w-4xl space-y-10 p-8 sm:p-10">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Tutorials</h1>
            <HelpHint contentClassName="max-w-sm">
              Guided walkthroughs you can open anytime. During a tutorial, use the X control in
              the top-right corner to exit and return here.
            </HelpHint>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TutorialCardLink
            to="/tutorial/all"
            title="Document tutorial"
            description="Learn how to use documents. Add files, find them under My content, check them out, and edit or delete them from Checked out."
            icon={<FileTextIcon className="size-6" weight="duotone" />}
            onClick={() => {
              setServiceRequestTutorialSession(false);
              setInboxTutorialSession(false);
            }}
          />
          <TutorialCardLink
            to="/tutorial/dashboard"
            title="Service requests tutorial"
            description="Learn how to use the service requests page. Search, new request, templates, filter, and sort."
            icon={<ClipboardTextIcon className="size-6" weight="duotone" />}
            onClick={() => {
              setServiceRequestTutorialSession(true);
              setInboxTutorialSession(false);
            }}
          />
          <TutorialCardLink
            to="/tutorial/dashboard"
            title="Inbox tutorial"
            description="Learn how to use inbox notifications. Filters, sort, bulk select, refresh, and reading items."
            icon={<BellSimpleIcon className="size-6" weight="duotone" />}
            onClick={() => {
              setInboxTutorialSession(true);
              setServiceRequestTutorialSession(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
