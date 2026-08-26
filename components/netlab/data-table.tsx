import { cn } from "@/lib/utils";

export function DataTable({
  caption,
  headers,
  rows,
  monoColumns,
  className,
}: {
  caption: string;
  headers: string[];
  rows: React.ReactNode[][];

  monoColumns?: number[];
  className?: string;
}) {
  const mono = new Set(monoColumns ?? []);
  return (
    <div
      className={cn("panel scroll-x", className)}
      tabIndex={0}
      role="region"
      aria-label={caption}
    >
      <table className="w-full min-w-max text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rail bg-panel-sunken text-left">
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-2.5 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-rail last:border-b-0"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-4 py-2.5 align-top",
                    mono.has(cellIndex) && "font-mono text-xs",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
