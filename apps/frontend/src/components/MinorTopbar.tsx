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
import { ButtonGroup } from "@/components/ui/button-group.tsx";
import IconSelector from "@/components/ui/custom/icon-selector.tsx";

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

function ViewSelectorButton() {
    return (
        <IconSelector
            defaultKey={"List"}
            options={{
                List: {
                    iconElement: <ListBulletsIcon/>
                },
                Grid: {
                    iconElement: <GridFourIcon/>
                }
            }}
        />
    )
}

export default function MinorTopbar() {
    return (
        <NavigationMenu className={"max-w-full"}>
            {/*Left Bar*/}
            <NavigationMenuList>
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
            <NavigationMenuList>
                <ButtonGroup className={"gap-1 overflow-hidden"}>
                    {/*Todo: Overflow Handling?*/}
                    {[
                        <FilterButton/>,
                        <SortButton/>,
                        <ViewSelectorButton/>
                    ].map((item) => {
                        return (
                            <NavigationMenuItem>
                                {item}
                            </NavigationMenuItem>
                        )
                    })}
                </ButtonGroup>
            </NavigationMenuList>
        </NavigationMenu>
    )
}