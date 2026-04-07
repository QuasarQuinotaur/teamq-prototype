import { createBrowserRouter } from "react-router-dom";
import App from '../App'
import About from "../pages/About";
import Home from "../pages/Home";
import Clients from "../pages/Clients"
import Documents from "@/pages/Documents";
import References from "@/pages/References";
import Dashboard from "@/pages/Dashboard";
import Tools from "@/pages/Tools";
import Recent from "@/pages/Recent.tsx";
import Bookmarked from "@/pages/Bookmarked.tsx";
import Workflow from "@/pages/Workflow";
import Employees from "@/pages/Employees.tsx";
import { RoleGuard } from "@/components/auth/RoleGuard";


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
                path: "about",
                element: <About />,
            },
            {
                path: "clients",
                element: <Clients />,
            },
            {
                path: "documents",
                element: <Documents />,
                children: [
                    {
                        index: true,
                        element: <Dashboard />,
                    },
                    {
                        path: "dashboard",
                        element: <Dashboard />,
                    },
                    {
                        path: "recent",
                        element: <Recent />,
                    },
                    {
                        path: "bookmarked",
                        element: <Bookmarked />,
                    },
                    {
                        path: "workflow",
                        element: <Workflow />,
                    },
                    {
                        path: "reference",
                        element: <References />,
                    },
                    {
                        path: "tools",
                        element: <Tools />,
                    },
                    {
                        element: <RoleGuard allowedRole="Admin" />, 
                        children: [
                        {
                            path: "/documents/employees",
                            element: <Employees />,
                        },
                        ],
                    },
                ]
            },
            {
                path: "References",
                element: <References />
            },
            {
                path: "Tools",
                element: <Tools />
            }
        ]
    }
])