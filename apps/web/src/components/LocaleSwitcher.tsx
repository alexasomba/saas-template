// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale
// @ts-ignore
import { getLocale, locales, setLocale } from "#/paraglide/runtime";
// @ts-ignore
import { m } from "#/paraglide/messages";

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale();

  return (
    <div
      className="flex items-center gap-2 px-1 pr-1.5 py-1 rounded-xl bg-white/5 border border-border/30 shrink-0"
      aria-label={m.language_label()}
    >
      <span className="text-[10px] font-bold tracking-widest uppercase text-cream/40 pl-2 select-none">
        {currentLocale}
      </span>
      <div className="flex gap-1">
        {locales.map((locale: string) => (
          <button
            key={locale}
            onClick={() => setLocale(locale)}
            aria-pressed={locale === currentLocale}
            className={`
              cursor-pointer px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all
              ${
                locale === currentLocale
                  ? "bg-copper text-charcoal shadow-sm shadow-copper/20"
                  : "text-cream/50 hover:text-cream hover:bg-white/5"
              }
            `}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
