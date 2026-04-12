// Displays information about employee (name, role, etc.)

import {Badge} from "@/elements/badge.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { MoreHorizontalIcon } from "lucide-react";
import {
    type CardState,
    CardContainer,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/cards/Card.tsx";


type EmployeeCardProps = CardState
export default function EmployeeCard({
                                         entry,
                                         // badges,
                                         createOptionsElement
}: EmployeeCardProps) {

    return (
        <CardContainer className="relative mx-auto w-fit min-w-[250px] pb-6">

            {/* options button */}
            {createOptionsElement != null && (
                <div className="absolute top-3 right-3 z-10">
                    {createOptionsElement(
                        // Create the "..." button and pass it to make a surrounding element
                        // This gives functionality to the button like showing a dropdown
                        <Button variant="outline" size="icon">
                            <MoreHorizontalIcon />
                        </Button>
                    )}
                </div>
            )}

            {/* avatar */}
            <div className="flex justify-center">
                <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                />
            </div>

            {/* content */}
            <CardHeader className="text-center">
                <CardTitle>{entry.title}</CardTitle>
                <div className="flex justify-center mt-2">
                    <Badge variant="secondary">
                        {entry.badge}
                    </Badge>
                </div>
                <CardDescription>{entry.description}</CardDescription>
            </CardHeader>

        </CardContainer>
    )
}