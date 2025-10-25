import type { ReactNode } from "react";

interface ResponsiveTableWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper für Tabellen um sie auf Mobile scrollbar zu machen
 */
export function ResponsiveTableWrapper({
  children,
}: ResponsiveTableWrapperProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">{children}</div>
    </div>
  );
}
