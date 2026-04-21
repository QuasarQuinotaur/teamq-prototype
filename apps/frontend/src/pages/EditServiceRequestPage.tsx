import { useParams } from "react-router-dom";
import { ServiceRequestEditor } from "@/components/service-requests/ServiceRequestEditor.tsx";

export default function EditServiceRequestPage() {
  const { id } = useParams<{ id: string }>();
  return <ServiceRequestEditor mode="edit" requestId={id} />;
}
