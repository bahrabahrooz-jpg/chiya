"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import "./table.css";

export interface TableColumn<Row> {
  key: keyof Row & string;
  header: ReactNode;
  align?: "left" | "right";
  numeric?: boolean;
  sortable?: boolean;
  render?: (value: Row[keyof Row], row: Row) => ReactNode;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  hover?: boolean;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  /** Key field for stable row keys. */
  rowKey?: keyof Row & string;
  className?: string;
}

/**
 * Table — data table for dashboards and admin views. Columns support custom
 * cell renderers, numeric (right-aligned, tabular) cells, and sortable headers.
 */
export function Table<Row extends object>({
  columns,
  rows,
  hover = true,
  sortKey,
  sortDir = "asc",
  onSort,
  rowKey,
  className = "",
}: TableProps<Row>) {
  return (
    <div className={["cx-tablewrap", className].filter(Boolean).join(" ")}>
      <table className={"cx-table" + (hover ? " cx-table--hover" : "")}>
        <thead>
          <tr>
            {columns.map((c) => {
              const isNum = c.align === "right" || c.numeric;
              const active = sortKey === c.key;
              return (
                <th
                  key={c.key}
                  className={[isNum ? "cx-th--num" : "", c.sortable ? "cx-th--sort" : ""].filter(Boolean).join(" ")}
                  onClick={c.sortable && onSort ? () => onSort(c.key) : undefined}
                >
                  <span className="cx-th__inner">
                    {c.header}
                    {c.sortable && (
                      <Icon
                        name={active ? (sortDir === "asc" ? "arrow-up" : "arrow-down") : "chevrons-up-down"}
                        size={13}
                        style={{ opacity: active ? 1 : 0.5 }}
                      />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={rowKey ? String(r[rowKey]) : ri}>
              {columns.map((c) => {
                const isNum = c.align === "right" || c.numeric;
                return (
                  <td key={c.key} className={isNum ? "cx-td--num" : ""}>
                    {c.render ? c.render(r[c.key], r) : (r[c.key] as ReactNode)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
