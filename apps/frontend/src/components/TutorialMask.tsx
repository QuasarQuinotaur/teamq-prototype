import { Button } from "@/elements/buttons/button.tsx"
import { useNavigate } from 'react-router-dom'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/elements/tooltip"
import type {ReactNode} from "react";


export default function TutorialMask({disabled}) {
    const navigate = useNavigate();


    function beginTutorial() {
        const highlightedButton = document.getElementById("tutorial-1")
        const mask = document.getElementById("tutorial-mask")

        console.log("started tutorial")

        highlightedButton.classList.add("z-11", "bg-background", "relative")
        highlightedButton.addEventListener("click", advanceTutorial)

        // const clone = highlightedButton.cloneNode(true)
        const maskClone = mask.cloneNode()

        highlightedButton.parentElement.appendChild(maskClone)
        // highlightedButton.appendChild(tooltip)

        // highlightedButton.replaceWith(clone)
        // const highlightedNode = highlightedButton as unknown as ReactNode

        // const tooltip =
        //     <Tooltip>
        //         <TooltipTrigger>
        //             {highlightedNode}
        //         </TooltipTrigger>
        //         <TooltipContent>
        //             <p>Add to library</p>
        //         </TooltipContent>
        //     </Tooltip>

        // const test = document.createTextNode(tooltip.toString())
        // highlightedButton.replaceWith(tooltip as unknown as Node)

        mask.remove()


    }

    function advanceTutorial() {
        console.log("next tutorial")
    }

    return (
        <>
            <div
                className="tutorial-mask z-10 text-background fixed top-0 left-0 w-full h-full flex items-center justify-center flex-wrap"
                hidden={disabled}
                id="tutorial-mask"
            >
                <div className="flex-return">
                    <h1>Welcome to IBank</h1>
                </div>
                <div className="flex-return justify-center">
                    <p>
                        Before you start working with IBank,
                        please consider taking the tutorial to learn about content management within IBank. <br/>
                        An 'Exit' button will be available in the upper right throughout the tutorial if you would like to quit at any point.
                    </p>
                </div>
                <div className="flex-return">
                    <Button
                        className="w-30 border border-accent-foreground on-hover:cursor-pointer"
                        onClick={beginTutorial}
                    >
                        Start Tutorial
                    </Button>
                    <span className="w-15"/>
                    <Button
                        variant="secondary"
                        className="w-30 border border-accent-foreground on-hover:cursor-pointer"
                        onClick={() => {navigate("/Documents/Dashboard")}}
                    >
                        Skip Tutorial
                    </Button>
                </div>

            </div>
        </>
    )
}