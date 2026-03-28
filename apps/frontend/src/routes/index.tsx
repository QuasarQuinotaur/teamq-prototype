import { createBrowserRouter } from "react-router-dom";
import App from '../App'
import About from "../pages/About";
import Home from "../pages/Home";
import People from "../pages/People"


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
                path: "people",
                element: <People />,
            },
        ]
    }
])