// Toolbar shows at the top of entry pages for querying

import * as React from "react";

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/NavigationMenu.tsx"
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
} from "@phosphor-icons/react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/elements/buttons/popover.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { ButtonGroup } from "@/elements/buttons/button-group.tsx";
import { SidebarTrigger } from "../../elements/sidebar-elements.tsx";
import ButtonSelector from "@/elements/buttons/button-selector.tsx";


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

export type ViewType = "List" | "Grid";

// these props are passed in from minor topbar, which get passed in from reference paging / tools paging
type ViewSelectorButtonProps = {
    view: ViewType
    setView: (view: ViewType) => void
}
function ViewSelectorButton( {view, setView }: ViewSelectorButtonProps ) {
    return (
        <ButtonSelector
            value={view}
            onChange={(val: ViewType) => setView(val)}
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


type ToolbarProps = {
    view: ViewType;
    setView: (view: ViewType) => void;
    extraElements?: React.ReactNode[];
};
export default function Toolbar({
                                        view,
                                        setView,
                                        extraElements
}: ToolbarProps) {
    const topRightElements = extraElements ? [...extraElements] : [];
    topRightElements.push(
        <FilterButton/>,
        <SortButton/>,
        <ViewSelectorButton view={view} setView={setView}/>
    )

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
                    {topRightElements.map((item) => {
                        // Make all elements in the top right
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