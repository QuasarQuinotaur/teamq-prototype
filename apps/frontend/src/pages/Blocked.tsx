import { LockKeyholeIcon } from "lucide-react"; // Or use <LockIcon /> from Phosphor
import { Button } from "@/elements/buttons/button.tsx";
import { useNavigate } from "react-router-dom";

export default function Blocked() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-gray-100 text-gray-800">
      <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Lock Icon in the middle */}
        <div className="p-4 bg-gray-50 rounded-full mb-6">
          <LockKeyholeIcon size={48} className="text-gray-400" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-gray-500 text-center max-w-xs mb-8">
          You do not have the required permissions to view the Employee directory. 
          Please contact an administrator if you believe this is an error.
        </p>

        <Button 
          variant="outline" 
          onClick={() => navigate("/documents/dashboard")}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}