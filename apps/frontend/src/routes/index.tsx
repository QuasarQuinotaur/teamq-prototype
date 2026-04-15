import { createBrowserRouter } from "react-router-dom";
import App from '../App'
import Home from "../pages/Home";
import Documents from "@/pages/Documents";
import References from "@/pages/References";
import Dashboard from "@/pages/Dashboard";
import Tools from "@/pages/Tools";
import Recent from "@/pages/Recent.tsx";
import Workflow from "@/pages/Workflow";
import AllDocuments from "@/pages/AllDocuments.tsx";
import Employees from "@/pages/Employees.tsx";
import ServiceRequestsPage from "@/pages/ServiceRequestsPage.tsx";
import NewServiceRequestPage from "@/pages/NewServiceRequestPage.tsx";
import EditServiceRequestPage from "@/pages/EditServiceRequestPage.tsx";
import Test from "@/pages/Test.tsx";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Profile from "@/pages/Profile.tsx";


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
                                path: "all",
                                element: <AllDocuments />,
                            },
                            {
                                path: "workflow",
                                element: <Workflow />,
                            },
                            {
                                path: "service-requests/new",
                                element: <NewServiceRequestPage />,
                            },
                            {
                                path: "service-requests/:id/edit",
                                element: <EditServiceRequestPage />,
                            },
                            {
                                path: "service-requests",
                                element: <ServiceRequestsPage />,
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
                                path: "profile",
                                element: <Profile />,
                            },
                            {
                                path: "test",
                                element: <Test />
                            },
                            {
                                element: <RoleGuard allowedRole="admin" />, 
                                children: [
                                {
                                    path: "/documents/employees",
                                    element: <Employees />,
                                },
                                ],
                            },
                        ]
                    },
                ]
            },
        ]
    }
])