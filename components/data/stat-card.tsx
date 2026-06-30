import { Icon, type IconName } from "@/components/ui/icon";
import "./stat-card.css";

export interface SparklineProps {
  data: number[];
  peakLast?: boolean;
}

/** Sparkline — tiny bar chart for stat cards. */
export function Sparkline({ data = [], peakLast = true }: SparklineProps) {
  const max = Math.max(...data, 1);
  return (
    <div className="cx-spark">
      {data.map((v, i) => (
        <div
          key={i}
          className={"cx-spark__bar" + (peakLast && i === data.length - 1 ? " cx-spark__bar--peak" : "")}
          style={{ height: Math.max(8, (v / max) * 100) + "%" }}
        />
      ))}
    </div>
  );
}

export type StatTone = "brand" | "gold" | "info" | "success";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaDir?: "up" | "down";
  sub?: React.ReactNode;
  icon?: IconName;
  tone?: StatTone;
  spark?: number[];
}

/**
 * StatCard — KPI tile: label, big value, trend delta, an icon chip, and an
 * optional sparkline.
 */
export function StatCard({
  label,
  value,
  delta,
  deltaDir,
  sub,
  icon,
  tone = "brand",
  spark,
  className = "",
  ...rest
}: StatCardProps) {
  return (
    <div className={["cx-stat", className].filter(Boolean).join(" ")} {...rest}>
      <div className="cx-stat__top">
        <span className="cx-stat__label">{label}</span>
        {icon && (
          <span className={`cx-stat__icon cx-stat__icon--${tone}`}>
            <Icon name={icon} size={20} />
          </span>
        )}
      </div>
      <div className="cx-stat__value">{value}</div>
      {spark && <Sparkline data={spark} />}
      {(delta != null || sub) && (
        <div className="cx-stat__foot">
          {delta != null && (
            <span className={"cx-stat__delta cx-stat__delta--" + (deltaDir || "up")}>
              <Icon name={deltaDir === "down" ? "trending-down" : "trending-up"} size={15} />
              {delta}
            </span>
          )}
          {sub && <span className="cx-stat__sub">{sub}</span>}
        </div>
      )}
    </div>
  );
}
