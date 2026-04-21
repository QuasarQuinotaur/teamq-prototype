import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Mail } from "lucide-react";

type NotificationItem = {
  id: number;
  type: string;
  customMsg?: string | null;
  dateSent: string;
  dateRead?: string | null;
};

const baseUrl = `${import.meta.env.VITE_BACKEND_URL}/api/notifications`;

export default function NotificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNotification() {
      if (!id) {
        setErrorMessage("Missing notification id.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const notificationId = Number(id);
        const response = await axios.get<NotificationItem>(`${baseUrl}/${notificationId}`, {
          withCredentials: true,
        });

        let detail = response.data;
        if (!detail.dateRead) {
          const markReadResponse = await axios.put<NotificationItem>(
            `${baseUrl}/read/${notificationId}`,
            {},
            { withCredentials: true },
          );
          detail = markReadResponse.data;
        }

        if (!cancelled) {
          setNotification(detail);
        }
      } catch (error) {
        if (!cancelled) {
          if (axios.isAxiosError(error)) {
            setErrorMessage(error.response?.data?.error ?? "Failed to load notification.");
          } else {
            setErrorMessage("Failed to load notification.");
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadNotification();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleMarkUnread() {
    if (!notification) return;
    try {
      await axios.put(`${baseUrl}/unread/${notification.id}`, {}, { withCredentials: true });
      navigate("/documents/notifications");
    } catch {
      // silently fail
    }
  }

  async function handleDelete() {
    if (!notification) return;
    try {
      await axios.delete(`${baseUrl}/${notification.id}`, { withCredentials: true });
      navigate("/documents/notifications");
    } catch {
      // silently fail
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-auto">
      {/* Top action bar */}
      <div className="flex items-center gap-1 border-b px-4 py-2">
        <Link
          to="/documents/notifications"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Inbox
        </Link>

        {notification && (
          <>
            <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={handleMarkUnread}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Mail className="size-4" />
              Mark unread
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <p className="p-6 text-muted-foreground">Loading notification...</p>
      ) : errorMessage ? (
        <p className="p-6 text-destructive">{errorMessage}</p>
      ) : notification ? (
        <div className="flex flex-1 flex-col px-8 py-6">
          {/* Subject line */}
          <h1 className="text-2xl font-semibold text-foreground">{notification.type}</h1>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              Sent{" "}
              <time dateTime={notification.dateSent}>
                {new Date(notification.dateSent).toLocaleString()}
              </time>
            </span>
            {notification.dateRead && (
              <span>
                Read{" "}
                <time dateTime={notification.dateRead}>
                  {new Date(notification.dateRead).toLocaleString()}
                </time>
              </span>
            )}
          </div>

          <hr className="my-5" />

          {/* Body */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {notification.customMsg?.trim() || "No additional message provided."}
          </p>
        </div>
      ) : (
        <p className="p-6 text-muted-foreground">Notification not found.</p>
      )}
    </section>
  );
}
