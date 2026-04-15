import React, { useState, useEffect } from "react";
import SettingsForm from "@/components/forms/SettingsForm.tsx";


export default function Settings() {

    const [theme, setTheme] = useState<string>();

    // Eventually fetch previously chosen theme
    // useEffect(() => {
    //     fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {
    //         credentials: "include",
    //     })
    //         .then(res => {
    //             if (!res.ok) throw new Error("Not authenticated");
    //             return res.json();
    //         })
    //         .then((data: Employee) => {
    //             setEmployee(data);
    //             return fetchProfilePhoto();
    //         })
    //         .catch(err => console.error(err));
    // }, []);

    function onThemeChange(e: string) {
        console.log(`Theme: ${e}`);
        document.documentElement.setAttribute("data-theme", e);
    }

    return (
        <>
            <div className={"bg-muted/50 flex flex-col flex-1 rounded-xl min-h-0 overflow-auto p-10"}>
                <SettingsForm onThemeChange={onThemeChange} />
            </div>
        </>
    )

}