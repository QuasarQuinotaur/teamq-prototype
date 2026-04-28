import { Button } from "@/elements/buttons/button.tsx"
import { useNavigate } from 'react-router-dom'



export default function TutorialMask({disabled}) {
    // const [tutorialStage, setTutorialStage] = useState<number>(1)
    const navigate = useNavigate();
    let tutorialStage = 1;

    const ids = [
        "tutorial-1",
        "tutorial-2",
        "document-add-form-name"
    ]


    function advanceTutorial() {
        console.log("advancing tutorial to stage:", tutorialStage)
        if(tutorialStage > 1) {
            const unHighlightedButton = top.document.getElementById(ids[tutorialStage-2])
            unHighlightedButton.classList.remove("z-101");
        }

        const observer = new MutationObserver(() => {

            const mask = top.document.getElementById("tutorial-mask")
            const maskClone = mask.cloneNode()
            const highlightedButton = top.document.getElementById(ids[tutorialStage-1])
            console.log("highlightedButton", highlightedButton)

            if (mask && maskClone && highlightedButton) {
                removeObserver();
                manipulateElements(mask, maskClone, highlightedButton);
            }
            else {
                observer.observe(top.document, {subtree: true, childList: true});
            }
        });
        const removeObserver = () => {
            if (observer) {
                observer.disconnect();
                console.log("removed")
            }
        }

        if(tutorialStage === 2) {
            navigate("/tutorial/true/all")
        }

        console.log("navigation completed")

        const mask = top.document.getElementById("tutorial-mask")
        const maskClone = mask.cloneNode()
        const highlightedButton = top.document.getElementById(`tutorial-${tutorialStage}`)

        if (mask && maskClone && highlightedButton) {
            manipulateElements(mask, maskClone, highlightedButton);
        } else {
            observer.observe(top.document, {subtree: true, childList: true});
        }

        function manipulateElements(mask: HTMLElement, maskClone: Node, highlightedButton: HTMLElement) {


            highlightedButton.classList.add("z-101", "bg-background", "relative")
            highlightedButton.classList.remove("bg-transparent")
            highlightedButton.parentElement.appendChild(maskClone)
            highlightedButton.setAttribute("href", "#")
            highlightedButton.addEventListener("click", advanceTutorial)

            if (tutorialStage === 1) {
                const buttonClone = highlightedButton.cloneNode(true)
                buttonClone.addEventListener("click", advanceTutorial)

                highlightedButton.replaceWith(buttonClone)
            }

            if (tutorialStage === 3) {
                mask.classList.remove("z-100")
                mask.classList.add("z-40")
            } else {
                // mask.setAttribute("hidden", "true")
                mask.replaceWith()
            }
            tutorialStage++
        }



    }


    return (
        <>
            <div
                className="tutorial-mask z-100 text-background fixed top-0 left-0 w-full h-full flex items-center justify-center flex-wrap"
                hidden={disabled}
                id="tutorial-mask"
            >
                <div className="flex-return">
                    <h1>Welcome to IBank</h1>
                </div>
                <div id="tutorial-text" className="flex-return justify-center bg-foreground rounded-4xl">
                    <p>
                        Before you start working with IBank,
                        please consider taking the tutorial to learn about content management within IBank. <br/>
                        An 'Exit' button will be available in the upper right throughout the tutorial if you would like to quit at any point.
                    </p>
                </div>
                <div className="flex-return">
                    {/*<Tooltip>*/}
                    {/*    <TooltipTrigger>*/}
                            <Button
                                className="w-30 border border-accent-foreground on-hover:cursor-pointer"
                                onClick={advanceTutorial}
                            >
                                Start Tutorial
                            </Button>
                    {/*    </TooltipTrigger>*/}
                    {/*    <TooltipContent id="tutorial-tooltip">*/}
                    {/*        <p>Click to begin</p>*/}
                    {/*    </TooltipContent>*/}
                    {/*</Tooltip>*/}

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