import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

function CardImage(props: { title: string; description: string; badge: string; action: string; link: string}) {
    const title: string = props.title
    const description: string = props.description
    const badge: string = props.badge
    const action: string = props.action
    const link: string = props.link

    let linkDomain = props.link.replace('https://', '').replace('http://', '');
    const split = linkDomain.split('/');

    if (split.length > 0) {
        linkDomain = split[0];
    }

    const imgDefault = "https://companieslogo.com/img/orig/THG-679dc08a.png?t=1720244494"
    const linkFavicon = "https://favicon.vemetric.com/" + linkDomain + "?default=" + imgDefault

    return (
        <Card className="relative mx-auto w-full max-w-sm pt-0">
            <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
            <img
                src={linkFavicon}
                alt="Event cover"
                className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
            />
            <CardHeader>
                <CardAction>
                    <Badge variant="secondary">{badge}</Badge>
                </CardAction>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button onClick={() => viewItem(link)} className="w-full">{action}</Button>
            </CardFooter>
        </Card>
    )
}

function viewItem(link: string) {
    window.open(link, "_blank")
}

export default CardImage;