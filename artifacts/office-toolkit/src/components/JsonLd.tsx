import { useEffect } from "react";

export function JsonLd({ id, data }: { id: string; data: Record<string, unknown> }) {
  const raw = JSON.stringify(data);
  useEffect(() => {
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = raw;
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [id, raw]);
  return null;
}