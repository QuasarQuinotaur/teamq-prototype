import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import Documents from "@/pages/Documents";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { documentLayoutChildren } from "@/routes/documentLayoutChildren.tsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <Home />,
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
