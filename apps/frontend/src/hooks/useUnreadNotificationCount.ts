import { useEffect, useState } from "react";
import axios from "axios";

const POLL_INTERVAL_MS = 5000;

export default function useUnreadNotificationCount(intervalMs = POLL_INTERVAL_MS): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const { data } = await axios.get<unknown[]>(
          `${import.meta.env.VITE_BACKEND_URL}/api/notifications/unread`,
          { withCredentials: true },
        );
        if (!cancelled) {
          setCount(Array.isArray(data) ? data.length : 0);
        }
      } catch {
        if (!cancelled) {
          setCount(0);
        }
      }
    };

    fetchCount();
    const intervalId = window.setInterval(fetchCount, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  return count;
}
