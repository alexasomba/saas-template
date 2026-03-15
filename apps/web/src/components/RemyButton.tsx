import { ChefHat, CaretRight } from "@phosphor-icons/react";
import { showRemyAssistant } from "#/lib/ui-stores";

export default function RemyButton() {
  return (
    <button
      onClick={() => showRemyAssistant.setState(() => true)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:shadow-lg hover:shadow-secondary/30 transition-all border border-secondary/20 group"
      aria-label="Open Remy Assistant"
    >
      <div className="relative">
        <ChefHat size={18} className="group-hover:-rotate-12 transition-transform" />
      </div>
      <span className="text-xs font-bold tracking-tight hidden md:block">Remy</span>
      <CaretRight
        weight="bold"
        className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
      />
    </button>
  );
}
