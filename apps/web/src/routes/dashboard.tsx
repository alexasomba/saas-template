import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  const privateData = useQuery(orpc.privateData.queryOptions());

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="bg-card border border-border/50 rounded-2xl p-8 mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Attendee Dashboard</h1>
        <p className="text-xl text-muted-foreground font-body">
          Welcome back,{" "}
          <span className="text-secondary italic font-semibold">{session?.user.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-4">Account Status</h2>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="text-primary font-medium">Active Participant</span>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-4">Latest Updates</h2>
          <p className="text-muted-foreground mb-2">Message from the organizer:</p>
          <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10 italic text-foreground">
            {(privateData.data as any)?.message || "No new messages."}
          </div>
        </div>
      </div>
    </div>
  );
}
