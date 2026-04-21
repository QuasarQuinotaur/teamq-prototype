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
import MyDocuments from "@/pages/MyDocuments.tsx";
import CheckedOut from "@/pages/CheckedOut.tsx";
import Employees from "@/pages/Employees.tsx";
import ServiceRequestsPage from "@/pages/ServiceRequestsPage.tsx";
import NewServiceRequestPage from "@/pages/NewServiceRequestPage.tsx";
import EditServiceRequestPage from "@/pages/EditServiceRequestPage.tsx";
import Test from "@/pages/Test.tsx";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Profile from "@/pages/Profile.tsx";
import DevCheckoutPage from "@/pages/DevCheckoutPage.tsx";
import Settings from "@/pages/Settings.tsx";
import Notifications from "@/pages/Notifications.tsx";
import NotificationDetail from "@/pages/NotificationDetail.tsx";


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
                                path: "my-documents",
                                element: <MyDocuments />,
                            },
                            {
                                path: "checked-out",
                                element: <CheckedOut />,
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
                                path: "settings",
                                element: <Settings />
                            },
                            {
                                path: "notifications",
                                element: <Notifications />
                            },
                            {
                                path: "notifications/:id",
                                element: <NotificationDetail />
                            },
                            {
                                element: <RoleGuard allowedRole="admin" />,
                                children: [
                                    {
                                        path: "/documents/employees",
                                        element: <Employees />,
                                    },
                                    {
                                        path: "dev-checkout",
                                        element: <DevCheckoutPage />,
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