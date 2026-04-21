// Displays information about employee (name, role, etc.)

import { Badge } from "@/elements/badge.tsx"
import { Button } from "@/elements/buttons/button.tsx"
import { MoreHorizontalIcon } from "lucide-react"
import {
  type CardState,
  CardContainer,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cards/Card.tsx"
import { cn } from "@/lib/utils.ts"
import { stringToAccentBgClass } from "@/lib/card-accent.ts"
import type { Employee } from "db";
import { JOB_POSITION_TYPE_MAP } from "@/components/input/constants.tsx";
import BadgeList from "@/elements/badge-list.tsx";

function initialsFromTitle(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type EmployeeCardProps = CardState
export default function EmployeeCard({
  entry,
  createOptionsElement,
}: EmployeeCardProps) {
  const hasImage = Boolean(entry.image?.trim())
  const accentClass = stringToAccentBgClass(entry.title)
  const avatarFrame =
    "h-32 w-32 rounded-full border-4 border-white shadow-md"

  const employee = entry.item as Employee;
  const badges: string[] = [
    JOB_POSITION_TYPE_MAP[employee.jobPosition as keyof typeof JOB_POSITION_TYPE_MAP] ??
      employee.jobPosition,
  ];

  return (
    <CardContainer className="relative mx-auto w-fit min-w-[250px] pb-6">
      {createOptionsElement != null && (
        <div className="absolute top-3 right-3 z-10">
          {createOptionsElement(
            <Button variant="outline" size="icon">
              <MoreHorizontalIcon />
            </Button>,
          )}
        </div>
      )}

      <div className="flex justify-center">
        {hasImage ? (
          <img
            src={entry.image}
            alt={entry.title}
            className={cn("object-cover", avatarFrame)}
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center text-5xl font-semibold text-white",
              avatarFrame,
              accentClass,
            )}
            aria-hidden
          >
            {initialsFromTitle(entry.title)}
          </div>
        )}
      </div>

      <CardHeader className="text-center">
        <CardTitle>{entry.title}</CardTitle>
        <div className="mt-2 flex justify-center">
          <BadgeList badges={badges}/>
        </div>
        <CardDescription>{entry.owner}</CardDescription>
      </CardHeader>
    </CardContainer>
  )
}