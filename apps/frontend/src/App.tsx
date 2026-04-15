import {Outlet} from 'react-router-dom'
import ErrorWrapper from './pages/Error'
import { useEffect } from "react";


export default function App() {

  useEffect(() => {
    document.documentElement.setAttribute("class", "theme-default");
  });

  return (
    <ErrorWrapper>
    <div className="app-shell">
      <main>
        <Outlet />
      </main>
    </div>
    </ErrorWrapper>
  )
}