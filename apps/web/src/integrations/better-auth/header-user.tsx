import { authClient } from "#/lib/auth-client";
import { Link } from "@tanstack/react-router";

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-lg shadow-md border border-border/50"
          />
        ) : (
          <div className="h-8 w-8 rounded-lg bg-accent/30 border border-border/50 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            void authClient.signOut();
          }}
          className="h-8 px-3 text-[10px] font-bold tracking-wider uppercase bg-accent/20 text-foreground border border-border/50 rounded-lg hover:bg-accent/40 hover:border-primary/30 transition-all"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/demo/better-auth"
      className="h-8 px-4 text-[10px] font-bold tracking-wider uppercase bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all inline-flex items-center"
    >
      Sign in
    </Link>
  );
}
