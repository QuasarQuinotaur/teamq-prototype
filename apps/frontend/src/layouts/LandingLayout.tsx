import { Outlet, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import { LandingFooter } from "@/layouts/LandingFooter";

export default function LandingLayout() {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [pathname]);

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <div className="min-h-0 flex-1">
                <Outlet />
            </div>
            <LandingFooter />
        </div>
    );
}
