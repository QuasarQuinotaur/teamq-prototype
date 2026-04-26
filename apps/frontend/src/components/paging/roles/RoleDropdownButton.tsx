
import { Button } from "@/elements/buttons/button";
import { AddressBookIcon, PencilIcon, PlusIcon } from "@phosphor-icons/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";


export default function RoleDropdownButton() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                // variant="outline"
                    className={
                        "px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    }
                >
                    <AddressBookIcon/>
                    Roles
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <PlusIcon/>
                        Create new role
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <PencilIcon/>
                        Modify roles
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}