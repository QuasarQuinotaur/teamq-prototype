import { Outlet } from "react-router-dom";
import ErrorWrapper from "./pages/Error";
import TutorialMask from "@/components/TutorialMask.tsx";

export default function App() {
  return (
    <ErrorWrapper>
      <div className="app-shell">
        <main>
          <Outlet />
        </main>
      </div>
    </ErrorWrapper>
  );
}