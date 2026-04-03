import { InboxIcon} from "lucide-react";
import { Button } from "@/components/ui/button"
export function ButtonWithIcon() {
    return (
        <Button variant="outline" size="lg">
            <InboxIcon /> Inbox
        </Button>
    )
}
