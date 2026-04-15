import type {Employee} from "db";
import {stringToAccentBgClass} from "@/lib/card-accent.ts";
import {JOB_POSITION_TYPE_MAP} from "@/components/input/constants.tsx";
import {CardContainer, CardDescription, CardTitle} from "@/components/cards/Card.tsx";
import {cn} from "@/lib/utils.ts";
import BadgeList from "@/elements/badge-list.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {useRef} from "react";

type EmployeeProfileCardProps = {
    employee: Employee;
    onUploadClick: () => void;
};

export default function EmployeeProfileCard({ employee, onUploadClick }: EmployeeProfileCardProps) {
    const hasImage = Boolean((employee as any).image?.trim());
    const accentClass = stringToAccentBgClass(
        `${employee.firstName} ${employee.lastName}`
    );

    const badges: string[] = [
        JOB_POSITION_TYPE_MAP[
            employee.jobPosition as keyof typeof JOB_POSITION_TYPE_MAP
            ] ?? employee.jobPosition,
    ];

    const initials = `${employee.firstName[0]}${employee.lastName[0]}`;


    return (
        <div className="p-6">
            <div className="px-10 py-10 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-6">

                        <div className="flex flex-col items-center gap-3">

                        {/* Avatar */}
                        {hasImage ? (
                            <img
                                src={(employee as any).image}
                                alt={employee.firstName}
                                className="h-48 w-48 rounded-full border-4 border-white shadow-md object-cover"
                            />
                        ) : (
                            <div
                                className={cn(
                                    "flex items-center justify-center text-6xl font-semibold text-white",
                                    "h-48 w-48 rounded-full border-4 border-white shadow-md",
                                    accentClass,
                                )}
                            >
                                {initials.toUpperCase()}
                            </div>
                        )}

                            {/* Button */}
                            <Button onClick={onUploadClick}>
                                Update profile picture
                            </Button>

                        </div>

                        {/* Info */}
                        <div className="flex flex-col">
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
                    </div>
                </div>
        </div>
    );
}