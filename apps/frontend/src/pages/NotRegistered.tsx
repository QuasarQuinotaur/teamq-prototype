import { UserXIcon } from "lucide-react";

export default function NotRegistered() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 bg-gray-50 rounded-full mb-6">
          <UserXIcon size={48} className="text-gray-400" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">Not Registered</h1>
        <p className="text-gray-500 text-center max-w-xs">
          Your account is not associated with any employee in the system. Please
          contact your administrator to get access.
        </p>
      </div>
    </div>
  );
}
