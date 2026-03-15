import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-12 text-center">
        <p className="text-primary font-medium tracking-wider uppercase text-sm mb-4">
          About the Conference
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
          A Celebration of <span className="text-secondary italic">Excellence</span>
        </h1>
        <p className="m-0 max-w-3xl mx-auto text-lg leading-relaxed text-muted-foreground font-body">
          The Paris International Pastry Conference brings together master artisans, visionary
          chefs, and culinary enthusiasts to explore the future of haute patisserie. From classic
          techniques to modern innovations, we celebrate the art of the possible.
        </p>
      </section>
    </main>
  );
}
