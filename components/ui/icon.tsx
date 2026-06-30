import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { LucideProps } from "lucide-react";

export type { IconName };

export interface IconProps extends Omit<LucideProps, "ref"> {
  /** Lucide icon name in kebab-case, e.g. "bed-double", "map-pin", "search". */
  name: IconName;
  size?: number;
}

/**
 * Icon — renders a Lucide line icon by kebab-case name.
 *
 * Faithful to the design system's Icon (currentColor, 1.75 stroke, round
 * caps/joins, block layout). Code-split per icon via lucide's DynamicIcon,
 * so we keep the original string-name API without bundling the full set.
 */
export function Icon({ name, size = 20, strokeWidth = 1.75, ...rest }: IconProps) {
  return (
    <DynamicIcon
      name={name}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...rest}
      style={{ display: "block", flex: "none", ...rest.style }}
    />
  );
}
