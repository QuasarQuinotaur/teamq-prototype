import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import About from "@/pages/About";
import Credits from "@/pages/Credits";
import LandingLayout from "@/layouts/LandingLayout";
import Documents from "@/pages/Documents";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { documentLayoutChildren } from "@/routes/documentLayoutChildren.tsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <LandingLayout />,
                children: [
                    {
                        index: true,
                        element: <Home />,
                    },
                    {
                        path: "about",
                        element: <About />,
                    },
                    {
                        path: "credits",
                        element: <Credits />,
                    },
                ],
            },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "documents",
                        element: <Documents />,
                        children: documentLayoutChildren,
                    },
                    {
                        path: "tutorial",
                        element: <Documents />,
                        children: documentLayoutChildren,
                    },
                ],
            },
        ],
    },
]);
