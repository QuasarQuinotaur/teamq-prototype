import SmoothPopupCard from "@/components/testing/SmoothPopup";
import { useState } from "react";
import axios from "axios";

type MeResponse = {
  id: number;
};

export default function Test() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addTestNotification = async () => {
    setIsSubmitting(true);
    setResultMessage(null);
    setErrorMessage(null);

    try {
      const meResponse = await axios.get<MeResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/me`,
        { withCredentials: true },
      );

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/upload`,
        {
          type: "Test Notification",
          employeeIds: [meResponse.data.id],
          customMsg: `Triggered from Test page at ${new Date().toLocaleTimeString()}`,
        },
        { withCredentials: true },
      );

      setResultMessage("Notification sent. It should appear in your inbox and as a popup.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.error ??
            "Unable to create test notification. Admin permissions may be required.",
        );
      } else {
        setErrorMessage("Unable to create test notification.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="rounded-md border bg-card p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Notifications Test</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use this button to create a notification for your own account via the admin upload endpoint.
        </p>
        <button
          type="button"
          onClick={addTestNotification}
          disabled={isSubmitting}
          className="mt-3 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Sending..." : "Add test notification"}
        </button>

        {resultMessage && <p className="mt-3 text-sm text-emerald-600">{resultMessage}</p>}
        {errorMessage && <p className="mt-3 text-sm text-destructive">{errorMessage}</p>}
      </div>

      <SmoothPopupCard />
    </div>
  );
}