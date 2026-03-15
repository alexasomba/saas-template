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
          <img src={session.user.image} alt="" className="h-8 w-8 rounded-lg shadow-md" />
        ) : (
          <div className="h-8 w-8 rounded-lg bg-white/5 border border-border/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-copper">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            void authClient.signOut();
          }}
          className="h-8 px-3 text-[10px] font-bold tracking-wider uppercase bg-white/5 text-cream/70 border border-border/30 rounded-lg hover:text-cream hover:bg-white/10 transition-all"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/demo/better-auth"
      className="h-8 px-3 text-[10px] font-bold tracking-wider uppercase bg-white/5 text-cream/70 border border-border/30 rounded-lg hover:text-cream hover:bg-white/10 transition-all inline-flex items-center"
    >
      Sign in
    </Link>
  );
}
