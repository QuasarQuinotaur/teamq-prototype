import { createBrowserRouter } from "react-router-dom";
import App from '../App'
import About from "../pages/About";
import Home from "../pages/Home";
import Clients from "../pages/Clients"
import Documents from "@/pages/Documents";
import References from "@/pages/References";
import Tools from "@/pages/Tools";


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