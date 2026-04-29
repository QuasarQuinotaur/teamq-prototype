import { Button } from "@/elements/buttons/button.tsx";
import { setServiceRequestTutorialSession } from "@/components/tutorial/serviceRequestTutorialStorage.ts";
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <div className="flex h-full flex-col items-center overflow-y-auto p-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Help</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Guided walkthroughs you can open anytime. During a tutorial, use the X control in
            the top-right corner to exit and return here.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="bg-card flex flex-col rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight">Document tutorial</h2>
            <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
              Add a document, find it under My content, check it out, then edit and delete it
              from Checked out.
            </p>
            <Button asChild className="mt-6 w-full" size="lg">
              <Link
                to="/tutorial/all"
                onClick={() => setServiceRequestTutorialSession(false)}
              >
                Open document tutorial
              </Link>
            </Button>
          </div>

          <div className="bg-card flex flex-col rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight">
              Service requests tutorial
            </h2>
            <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
              Highlights the toolbar on the list page—search, new request, templates, filter, and
              sort—so you know what each control does. You won’t create or change anything.
            </p>
            <Button asChild className="mt-6 w-full" size="lg">
              <Link
                to="/tutorial/dashboard"
                onClick={() => setServiceRequestTutorialSession(true)}
              >
                Open service requests tutorial
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
