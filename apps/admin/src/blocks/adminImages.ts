const createSvgDataUri = (svg: string): string =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

type BlockVisualArgs = {
  accent: string;
  label: string;
};

export const createBlockAdminImages = ({
  accent,
  label,
}: BlockVisualArgs): { icon: string; thumbnail: string } => {
  const safeLabel = label.slice(0, 14);

  return {
    icon: createSvgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
        <rect width="20" height="20" rx="6" fill="${accent}"/>
        <path d="M5 6.5h10M5 10h10M5 13.5h6" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`,
    ),
    thumbnail: createSvgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" fill="none">
        <rect width="480" height="320" rx="24" fill="#0F172A"/>
        <rect x="24" y="24" width="432" height="272" rx="18" fill="#111827"/>
        <rect x="40" y="40" width="140" height="28" rx="14" fill="${accent}"/>
        <rect x="40" y="96" width="400" height="24" rx="12" fill="#1F2937"/>
        <rect x="40" y="136" width="340" height="18" rx="9" fill="#334155"/>
        <rect x="40" y="166" width="300" height="18" rx="9" fill="#334155"/>
        <rect x="40" y="228" width="120" height="32" rx="16" fill="${accent}"/>
        <text x="40" y="210" fill="#E5E7EB" font-family="Arial, sans-serif" font-size="26" font-weight="700">${safeLabel}</text>
      </svg>`,
    ),
  };
};

export const createBlockImageAlt = (label: string, description: string) =>
  `${label} block ${description}`;
