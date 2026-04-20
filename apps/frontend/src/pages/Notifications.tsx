import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

type NotificationItem = {
  id: number;
  type: string;
  customMsg?: string | null;
  dateSent: string;
  dateRead?: string | null;
};

function NotificationCard({
  notification,
  isUnread,
}: {
  notification: NotificationItem;
  isUnread: boolean;
}) {
  return (
    <article className="rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-card-foreground">{notification.type}</h3>
          <p className="text-sm text-muted-foreground">
            {notification.customMsg?.trim() || "No additional message provided."}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isUnread
              ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isUnread ? "Unread" : "Read"}
        </span>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        Sent: {new Date(notification.dateSent).toLocaleString()}
      </div>
    </article>
  );
}

export default function Notifications() {
  const [unread, setUnread] = useState<NotificationItem[]>([]);
  const [read, setRead] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sortedUnread = useMemo(
    () =>
      [...unread].sort(
        (a, b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime(),
      ),
    [unread],
  );

  const sortedRead = useMemo(
    () =>
      [...read].sort(
        (a, b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime(),
      ),
    [read],
  );

  const fetchNotifications = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const [unreadResponse, readResponse] = await Promise.all([
        axios.get<NotificationItem[]>(
          `${import.meta.env.VITE_BACKEND_URL}/api/notifications/unread`,
          { withCredentials: true },
        ),
        axios.get<NotificationItem[]>(
          `${import.meta.env.VITE_BACKEND_URL}/api/notifications/read`,
          { withCredentials: true },
        ),
      ]);

      setUnread(unreadResponse.data);
      setRead(readResponse.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.error ?? "Failed to load notifications.");
      } else {
        setErrorMessage("Failed to load notifications.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button
          type="button"
          onClick={fetchNotifications}
          className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading notifications...</p>
      ) : errorMessage ? (
        <p className="text-destructive">{errorMessage}</p>
      ) : (
        <div className="grid gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-medium">Unread ({sortedUnread.length})</h2>
            {sortedUnread.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unread notifications.</p>
            ) : (
              sortedUnread.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} isUnread />
              ))
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-medium">Read ({sortedRead.length})</h2>
            {sortedRead.length === 0 ? (
              <p className="text-sm text-muted-foreground">No read notifications.</p>
            ) : (
              sortedRead.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} isUnread={false} />
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
