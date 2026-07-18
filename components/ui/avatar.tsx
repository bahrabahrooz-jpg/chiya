import { Icon } from "./icon";
import "./avatar.css";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  name?: string;
  size?: AvatarSize;
  /** Subtle neutral ring. */
  ring?: boolean;
  /** Show a status dot (success green). */
  status?: boolean;
  /** Brand verified seal badge (matches the mobile app's agent avatar). */
  verified?: boolean;
}

const GROUP_PX: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };

function initials(name?: string) {
  if (!name) return "";
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}

/**
 * Avatar — agent / user portrait with initials fallback and an optional
 * status or gold "verified" badge.
 */
export function Avatar({
  src,
  name,
  size = "md",
  ring,
  status,
  verified,
  className = "",
  ...rest
}: AvatarProps) {
  const cls = [
    "cx-avatar",
    `cx-avatar--${size}`,
    ring ? "cx-avatar--ring" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  // Same proportions as the mobile AgentAvatar: badge ≈ 0.3× avatar (min 14px).
  const bSize = Math.max(14, Math.round(GROUP_PX[size] * 0.3));

  return (
    <span className={cls} {...rest}>
      {src ? (
        // Generic fixed-size portrait from arbitrary remote URLs; next/image
        // would force per-domain config on a primitive. Intentional <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || ""} />
      ) : (
        initials(name)
      )}
      {(status || verified) && (
        <span
          className={"cx-avatar__badge" + (verified ? " cx-avatar__badge--verified" : "")}
          style={{ width: bSize, height: bSize }}
        >
          {verified && <Icon name="badge-check" size={Math.round(bSize * 0.53)} strokeWidth={2.5} />}
        </span>
      )}
    </span>
  );
}

export interface AvatarGroupProps {
  avatars?: AvatarProps[];
  max?: number;
  size?: AvatarSize;
}

/** AvatarGroup — overlapping stack with a +N overflow chip. */
export function AvatarGroup({ avatars = [], max = 4, size = "sm" }: AvatarGroupProps) {
  const shown = avatars.slice(0, max);
  const extra = avatars.length - shown.length;
  const px = GROUP_PX[size];
  return (
    <span className="cx-avatargroup">
      {shown.map((a, i) => (
        <Avatar key={i} size={size} {...a} />
      ))}
      {extra > 0 && (
        <span
          className="cx-avatargroup__more"
          style={{ width: px, height: px, fontSize: px * 0.36 }}
        >
          {"+" + extra}
        </span>
      )}
    </span>
  );
}
