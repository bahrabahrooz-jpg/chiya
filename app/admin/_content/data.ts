import type { IconName } from "@/components/ui/icon";

/* ----------------------------------------------------------------------------
   Static metadata for the Content (CMS) hub — the left-nav sections and the
   fixed About-page value icons. Editable copy lives in the site-content store
   (lib/site-content.ts); only the structural bits that the admin cannot change
   (icons, section identity) live here.
   ------------------------------------------------------------------------- */

export type ContentSectionId = "home" | "faq" | "footer" | "legal" | "about";

export interface ContentSection {
  id: ContentSectionId;
  labelKey: string;
  icon: IconName;
}

export const CONTENT_SECTIONS: ContentSection[] = [
  { id: "home", labelKey: "admin.content.nav.home", icon: "house" },
  { id: "faq", labelKey: "admin.content.nav.faq", icon: "circle-help" },
  { id: "footer", labelKey: "admin.content.nav.footer", icon: "panel-bottom" },
  { id: "legal", labelKey: "admin.content.nav.legal", icon: "scale" },
  { id: "about", labelKey: "admin.content.nav.about", icon: "info" },
];

/* The About "values" cards keep fixed icons (about-app.tsx owns the layout);
   the admin edits only their title/description. Order matches DEFAULT_CONTENT
   .about.values. */
export const ABOUT_VALUE_ICONS: IconName[] = ["shield-check", "eye", "handshake", "map-pin"];

/* The homepage "Why Chiya" pillars keep fixed icons (why-chiya.tsx owns the
   layout); the admin edits only their title/description. Order matches
   DEFAULT_CONTENT.home.pillars. */
export const HOME_PILLAR_ICONS: IconName[] = ["badge-check", "shield-check", "sparkles", "lock"];

/* Labels for the homepage band-header editor, keyed by HomeSectionId. */
export const HOME_SECTION_LABEL_KEYS: Record<string, string> = {
  feat2: "admin.content.home.secFeatured",
  cats: "admin.content.home.secCategories",
  locs: "admin.content.home.secLocations",
  why: "admin.content.home.secWhy",
  agents: "admin.content.home.secAgents",
  test: "admin.content.home.secTestimonials",
};
