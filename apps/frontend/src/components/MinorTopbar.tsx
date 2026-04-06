import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/elements/separator.tsx"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput
} from "@/elements/input-group.tsx";
import {
    MagnifyingGlassIcon,
    FunnelSimpleIcon,
    ArrowsDownUpIcon,
    ListBulletsIcon,
    GridFourIcon,
    PlusIcon,
} from "@phosphor-icons/react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/elements/buttons/popover.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { ButtonGroup } from "@/elements/buttons/button-group.tsx";
import ButtonSelector from "@/elements/buttons/button-selector.tsx";
import DocumentForm from "@/components/forms/DocumentForm.tsx";
import { SidebarTrigger } from "../elements/sidebar-elements.tsx";

function AddDocumentButton() {
    return (
        <Popover>
            <PopoverTrigger>
                <Button variant={"outline"}>
                    <PlusIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className={"w-max"}>
                <DocumentForm/>
            </PopoverContent>
        </Popover>
    )
}

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
        <ButtonSelector
            defaultOption={"List"}
            options={{
                List: {
                    buttonElement: <ListBulletsIcon/>
                },
                Grid: {
                    buttonElement: <GridFourIcon/>
                }
            }}
        />
    )
}

export default function MinorTopbar() {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 w-full">
        <NavigationMenu className={"max-w-full"}>
            {/*Left Bar*/}
            <SidebarTrigger className="-ml-1" />
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
                        <AddDocumentButton/>,
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
        </div>
        </header>
    )
}