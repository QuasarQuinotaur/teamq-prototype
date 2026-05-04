import {useEffect, useState} from "react";

const STORAGE_KEY = "sticky_note_session";

export default function StickyNoteWidget() {
    const [text, setText] = useState(() => {
        return sessionStorage.getItem(STORAGE_KEY) || "";
    });

    // persist
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, text);
    }, [text]);

    return (
        <div className="flex flex-col h-full p-5 border rounded-lg bg-background shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">
                Note Pad
            </div>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write something..."
                className="flex-1 resize-none bg-transparent outline-none text-sm"
            />
        </div>
    );
}