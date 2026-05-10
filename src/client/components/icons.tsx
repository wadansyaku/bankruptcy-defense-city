interface IconProps {
  name: "city" | "shield" | "card" | "bag" | "gear" | "map" | "moon" | "save";
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  const common = {
    className: `icon ${className ?? ""}`,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.3 2.8 8 7 10 4.2-2 7-5.7 7-10V6l-7-3Z" />
      </svg>
    );
  }
  if (name === "card") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M7 9h10M7 13h5" />
      </svg>
    );
  }
  if (name === "bag") {
    return (
      <svg {...common}>
        <path d="M7 9h10l1 11H6L7 9Z" />
        <path d="M9 9a3 3 0 0 1 6 0" />
      </svg>
    );
  }
  if (name === "gear") {
    return (
      <svg {...common}>
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
      </svg>
    );
  }
  if (name === "map") {
    return (
      <svg {...common}>
        <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    );
  }
  if (name === "moon") {
    return (
      <svg {...common}>
        <path d="M17.5 15.5A7.5 7.5 0 0 1 8.5 6a7.5 7.5 0 1 0 9 9.5Z" />
      </svg>
    );
  }
  if (name === "save") {
    return (
      <svg {...common}>
        <path d="M5 4h12l2 2v14H5V4Z" />
        <path d="M8 4v6h8V4M8 17h8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 20V9l4-4 4 4 4-4 4 4v11H4Z" />
      <path d="M8 20v-6h4v6M15 20v-8h3v8" />
    </svg>
  );
}
