import { Link } from "@tanstack/react-router";
import TanChatAIAssistant from "./demo-AIAssistant";
import ParaglideLocaleSwitcher from "./LocaleSwitcher";
import BetterAuthHeader from "../integrations/better-auth/header-user";
import RemyButton from "./RemyButton";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 h-16">
        {/* Left section: Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02]"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-linear-to-br from-copper via-copper-dark to-gold rounded-lg shadow-lg shadow-copper/20 group-hover:rotate-6 transition-transform" />
              <div className="w-1.5 h-1.5 rounded-full bg-background" />
            </div>
            <span className="font-display font-bold text-foreground group-hover:text-gold transition-colors tracking-tight">
              TanStack Start
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              activeProps={{ className: "!text-gold !bg-gold/10" }}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              activeProps={{ className: "!text-gold !bg-gold/10" }}
            >
              About
            </Link>
            <Link
              to="/schedule"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              activeProps={{ className: "!text-gold !bg-gold/10" }}
            >
              Schedule
            </Link>
            <a
              href="https://tanstack.com/start/latest/docs/framework/react/overview"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              target="_blank"
              rel="noreferrer"
            >
              Docs
            </a>
          </div>
        </div>

        {/* Right section: Actions & Tools */}
        <div className="flex items-center gap-2">
          {/* Social icons - only on larger screens */}
          <div className="hidden xl:flex items-center gap-1 border-r border-border/30 pr-2 mr-1">
            <a
              href="https://x.com/tan_stack"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-muted-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-all"
            >
              <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                <path d="M12.6 1h2.2L10 6.48 15.64 15h-4.41L7.78 9.82 3.23 15H1l5.14-5.84L.72 1h4.52l3.12 4.73L12.6 1zm-.77 12.67h1.22L4.57 2.26H3.26l8.57 11.41z" />
              </svg>
            </a>
            <a
              href="https://github.com/TanStack"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-muted-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-all"
            >
              <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>

          <TanChatAIAssistant />
          <BetterAuthHeader />
          <RemyButton />

          <div className="h-4 w-px bg-border/30 mx-1 hidden sm:block" />

          <ParaglideLocaleSwitcher />
          <ThemeToggle />

          {/* Mobile menu - simplified dropdown */}
          <details className="relative lg:hidden">
            <summary className="list-none cursor-pointer p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </summary>
            <div className="absolute top-full right-0 mt-2 w-48 py-2 bg-popover border border-border shadow-2xl rounded-xl">
              <Link
                to="/demo/ai-chat"
                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-accent"
              >
                AI Chat
              </Link>
              <Link
                to="/demo/ai-image"
                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-accent"
              >
                AI Image
              </Link>
              <Link
                to="/demo/ai-structured"
                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-accent"
              >
                AI Structured
              </Link>
              <div className="h-px bg-border/30 my-2" />
              <Link
                to="/schedule"
                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-accent"
              >
                Schedule
              </Link>
              <Link
                to="/speakers"
                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-accent"
              >
                Speakers
              </Link>
              <Link
                to="/talks"
                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-accent"
              >
                Sessions
              </Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
