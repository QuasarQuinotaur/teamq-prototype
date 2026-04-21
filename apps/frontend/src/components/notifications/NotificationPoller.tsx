import { useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";

type NotificationPayload = {
  id: number;
  type: string;
  customMsg?: string | null;
  dateSent?: string;
};

const POLL_INTERVAL_MS = 3000;

export default function NotificationPoller() {
  const seenNotificationIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const pollNewNotifications = async () => {
      try {
        const response = await axios.get<NotificationPayload[]>(
          `${import.meta.env.VITE_BACKEND_URL}/api/notifications/new`,
          { withCredentials: true },
        );

        if (cancelled) {
          return;
        }

        for (const notification of response.data) {
          if (seenNotificationIds.current.has(notification.id)) {
            continue;
          }

          seenNotificationIds.current.add(notification.id);

          const description =
            notification.customMsg?.trim() ||
            (notification.dateSent
              ? `Sent ${new Date(notification.dateSent).toLocaleString()}`
              : "You have a new notification.");

          toast(notification.type || "New notification", {
            description,
          });
        }
      } catch {
        // Ignore polling errors (includes unauthenticated sessions).
      }
    };

    pollNewNotifications();
    const intervalId = window.setInterval(pollNewNotifications, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
