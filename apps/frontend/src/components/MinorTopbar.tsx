import { useState } from "react";

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput
} from "@/components/ui/input-group.tsx";
import {
    MagnifyingGlassIcon,
    FunnelSimpleIcon,
    ArrowsDownUpIcon,
    ListBulletsIcon,
    GridFourIcon,
} from "@phosphor-icons/react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import {Item} from "@/components/ui/item.tsx";

function FilterButton() {
    return (
        <Popover>
            <PopoverTrigger>
                <Button variant={"outline"}>
                    <FunnelSimpleIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div>
                    <p>Filter Example</p>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function SortButton() {
    return (
        <Popover>
            <PopoverTrigger>
                <Button variant={"outline"}>
                    <ArrowsDownUpIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div>
                    <p>Sort Example</p>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const viewTypes = {
    List: {
        icon: <ListBulletsIcon/>
    },
    Grid: {
        icon: <GridFourIcon/>
    }
}
type ViewType = keyof typeof viewTypes
function ViewSelectorButton() {
    // Would pass in props.setViewType() to toggle on page
    const [selectedViewType, setSelectedViewType] = useState<ViewType>("List")

    return (
        <Item variant={"outline"} className={"gap-0.5 py-0 px-0"}>
            {Object.entries(viewTypes).map(([viewType, iconType]) => (
                <Button
                    id={viewType}
                    variant={viewType == selectedViewType ? "default" : "ghost"}
                    onClick={() => {
                        if (viewType != selectedViewType) {
                            setSelectedViewType(viewType as ViewType)
                        }
                    }}
                >
                    {iconType.icon}
                </Button>
            ))}
        </Item>
    )
}

export default function MinorTopbar() {
    return (
        <NavigationMenu className={"max-w-full"}>
            {/*Left Bar*/}
            <NavigationMenuList className={"flex w-full"}>
                <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]"/>
                <NavigationMenuItem>
                    <InputGroup>
                        <InputGroupInput
                            id={"minor-topbar-search"}
                            placeholder={"Search..."}
                            // value={name}
                            // onChange={(e) =>
                            //     setName(e.target.value)}
                        />
                        <InputGroupAddon align={"inline-end"}>
                            <MagnifyingGlassIcon/>
                        </InputGroupAddon>
                    </InputGroup>
                </NavigationMenuItem>
            </NavigationMenuList>
            <div className="flex-1"/>
            {/*Right Bar*/}
            <NavigationMenuList className={"gap-1"}>
                <NavigationMenuItem>
                    <FilterButton/>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <SortButton/>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <ViewSelectorButton/>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}