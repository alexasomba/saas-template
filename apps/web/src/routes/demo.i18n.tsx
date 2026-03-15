import { createFileRoute } from "@tanstack/react-router";
import logo from "../logo.svg";
// @ts-ignore
import { m } from "#/paraglide/messages";
import LocaleSwitcher from "../components/LocaleSwitcher";

export const Route = createFileRoute("/demo/i18n")({
  component: App,
});

function App() {
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground text-[calc(10px+2vmin)] gap-6 p-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img
            src={logo}
            className="relative h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
            alt="logo"
          />
        </div>
        <p className="font-display font-bold">
          {m.example_message({ username: "TanStack Router" })}
        </p>
        <a
          className="text-primary hover:text-primary/80 transition-colors underline underline-offset-8 decoration-secondary/30 hover:decoration-secondary"
          href="https://inlang.com/m/gerre34r/library-inlang-paraglideJs"
          target="_blank"
          rel="noopener noreferrer"
        >
          {m.learn_router()}
        </a>
        <div className="mt-8">
          <LocaleSwitcher />
        </div>
      </header>
    </div>
  );
}
