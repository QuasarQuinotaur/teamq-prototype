import Dashboard from "@/pages/Dashboard";
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
import Profile from "@/pages/Profile.tsx";
import DevCheckoutPage from "@/pages/DevCheckoutPage.tsx";
import AdminCheckIn from "@/pages/AdminCheckIn.tsx";
import Announcements from "@/pages/Announcements.tsx";
import Settings from "@/pages/Settings.tsx";
import Notifications from "@/pages/Notifications.tsx";
import NotificationDetail from "@/pages/NotificationDetail.tsx";
import RoleDocuments from "@/pages/RoleDocuments.tsx";
import Tutorials from "@/pages/Tutorials.tsx";
import References from "@/pages/References";
import Tools from "@/pages/Tools";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Navigate, type RouteObject } from "react-router-dom";

/** Shared under `path: documents` and `path: tutorial` (relative paths resolve per parent). */
export const documentLayoutChildren: RouteObject[] = [
    {
        index: true,
        element: <Navigate to="dashboard" replace />,
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
        path: "role/:role",
        element: <RoleDocuments />,
    },
    {
        path: "profile",
        element: <Profile />,
    },
    {
        path: "test",
        element: <Test />,
    },
    {
        path: "settings",
        element: <Settings />,
    },
    {
        path: "notifications",
        element: <Notifications />,
    },
    {
        path: "notifications/:id",
        element: <NotificationDetail />,
    },
    {
        path: "about",
        element: <Navigate to="/about" replace />,
    },
    {
        path: "tutorials",
        element: <Tutorials />,
    },
    {
        path: "help",
        element: <Navigate to="../tutorials" replace />,
    },
    {
        path: "credits",
        element: <Navigate to="/credits" replace />,
    },
    {
        element: <RoleGuard onlyAdmins />,
        children: [
            {
                path: "employees",
                element: <Employees />,
            },
            {
                path: "dev-checkout",
                element: <DevCheckoutPage />,
            },
            {
                path: "admin-check-in",
                element: <AdminCheckIn />,
            },
            {
                path: "announcements",
                element: <Announcements />,
            },
        ],
    },
];
