import type {Employee} from "db";
import {stringToAccentBgClass} from "@/lib/card-accent.ts";
import {CardDescription, CardTitle} from "@/components/cards/Card.tsx";
import {cn} from "@/lib/utils.ts";
import BadgeList from "@/elements/badge-list.tsx";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";
import {useRef, useState} from "react";
import useJobNameMap from "@/hooks/useJobNameMap";
import { PencilIcon } from "@phosphor-icons/react";
import { FormOfType } from "../forms/FormOfType";
import useGetEmployeeIsAdmin from "@/hooks/useGetEmployeeIsAdmin";

type EmployeeProfileCardProps = {
    employee: Employee;
    onUploadClick: () => void;
    refetchEmployee: () => void;
};

export default function EmployeeProfileCard({
                                                employee,
                                                onUploadClick,
                                                refetchEmployee
}: EmployeeProfileCardProps) {
    const hasImage = Boolean((employee as any).image?.trim());
    const accentClass = stringToAccentBgClass(
        `${employee.firstName} ${employee.lastName}`
    );

    const { jobNameMap, rolesLoading } = useJobNameMap();
    const badges: string[] = !rolesLoading ? [
        jobNameMap[
            employee.jobPosition as keyof typeof jobNameMap
        ] ?? employee.jobPosition,
    ] : [];

    const initials = `${employee.firstName[0]}${employee.lastName[0]}`;
    const buttonClass = "px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

    const [formOpen, setFormOpen] = useState(false);

    return (
        <div className="p-6">
            <div className="rounded-2xl border border-border bg-card px-10 py-10">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-3">
                        {/* Avatar */}
                        {hasImage ? (
                            <img
                                src={(employee as any).image}
                                alt={employee.firstName}
                                className="h-48 w-48 rounded-full border-4 border-border bg-muted shadow-md object-cover"
                            />
                        ) : (
                            <div
                                className={cn(
                                    "flex items-center justify-center text-6xl font-semibold text-foreground",
                                    "h-48 w-48 rounded-full border-4 border-border shadow-md",
                                    accentClass,
                                )}
                            >
                                {initials.toUpperCase()}
                            </div>
                        )}

                            {/* Button */}
                            <Button
                                onClick={onUploadClick}
                                className={buttonClass}
                            >
                                Update profile picture
                            </Button>

                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-3 items-start">
                        <div className="flex flex-col h-48 justify-center">
                            <CardTitle>
                                {employee.firstName} {employee.lastName}
                            </CardTitle>

                            <div className="mt-2">
                                <BadgeList badges={badges} />
                            </div>

                            <CardDescription className="mt-1">
                                {employee.email}
                            </CardDescription>
                        </div>
                        <Dialog
                            open={formOpen}
                            onOpenChange={(open) => {
                                setFormOpen(open);
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    className={buttonClass}
                                >
                                    <PencilIcon/>
                                    Edit Profile
                                </Button>
                            </DialogTrigger>
                            <DialogContent className={"sm:max-w-lg"}>
                                <div className="flex items-center gap-2">
                                    <h2 className="m-0 border-b-0 pb-0 text-base font-semibold leading-none">
                                        Update Your Profile
                                    </h2>
                                    <HelpHint contentClassName="max-w-sm">
                                        Change how you are displayed to other employees.
                                    </HelpHint>
                                </div>
                                <FormOfType
                                    formType={"Employee"}
                                    baseItem={employee}
                                    hideAdminOptions={true}
                                    onCancel={() => {
                                        setFormOpen(false);
                                        refetchEmployee();
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    );
}