"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ApForm } from "@/app/admin/_add-property/data";

/**
 * Chiya Estate — member listings store.
 *
 * The properties a signed-in member has submitted through the website, persisted
 * to localStorage (there is no real backend). Powers the My Listings page and
 * the multi-step submission flow. Kept deliberately separate from the admin
 * `properties-store` — this is the member-owned slice of the catalog.
 */

export const LISTINGS_KEY = "chiya_member_listings_v1";

export type ListingStatus = "draft" | "pending" | "published" | "rejected";
export type ListingDeal = "sale" | "rent";

export interface MemberListing {
  id: string;
  title: string;
  location: string;
  city?: string;
  deal: ListingDeal;
  status: ListingStatus;
  cover: string;
  price?: string;
  beds?: number;
  baths?: number;
  area?: string;
  description?: string;
  /** Uploaded gallery image URLs (cover first) so edit can restore media. */
  gallery?: string[];
  /** Raw submission form, kept so the member can edit the listing later. */
  form?: ApForm;
  /** ISO timestamp of the last edit — rendered as "Updated …". */
  updatedAt: string;
}

/** Draft shape used while composing a listing (all fields optional/strings). */
export interface ListingDraft {
  id?: string;
  title: string;
  deal: ListingDeal;
  type: string;
  price: string;
  currency: string;
  area: string;
  areaUnit: string;
  beds: number;
  baths: number;
  city: string;
  district: string;
  address: string;
  description: string;
  cover: string;
}

export const EMPTY_DRAFT: ListingDraft = {
  title: "",
  deal: "sale",
  type: "",
  price: "",
  currency: "USD",
  area: "",
  areaUnit: "m²",
  beds: 0,
  baths: 0,
  city: "",
  district: "",
  address: "",
  description: "",
  cover: "",
};

function read(): MemberListing[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LISTINGS_KEY) || "[]");
    return Array.isArray(raw) ? (raw as MemberListing[]) : [];
  } catch {
    return [];
  }
}

let state: MemberListing[] = [];
let hydrated = false;

const listeners = new Set<() => void>();
function persist() {
  try {
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = read();
  }
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === LISTINGS_KEY) {
      state = read();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
const getSnapshot = () => state;
const EMPTY: MemberListing[] = [];
const getServerSnapshot = () => EMPTY;

const CUR: Record<string, string> = { USD: "$", EUR: "€", IQD: "IQD " };
const fmtNum = (n: string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Turn a compose draft into a stored listing at the given status. */
export function draftToListing(d: ListingDraft, status: ListingStatus): MemberListing {
  const loc = [d.district, d.city].filter(Boolean).join(", ") || d.address || "Kurdistan";
  return {
    id: d.id || "ml-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: d.title.trim() || "Untitled property",
    location: loc,
    city: d.city || undefined,
    deal: d.deal,
    status,
    cover: d.cover || "",
    price: d.price ? (CUR[d.currency] || "") + fmtNum(d.price) : undefined,
    beds: d.beds || undefined,
    baths: d.baths || undefined,
    area: d.area ? fmtNum(d.area) + " " + d.areaUnit : undefined,
    description: d.description.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function addListing(listing: MemberListing) {
  state = [listing, ...state];
  persist();
}
export function updateListing(id: string, patch: Partial<MemberListing>) {
  state = state.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l));
  persist();
}
export function removeListing(id: string) {
  state = state.filter((l) => l.id !== id);
  persist();
}

export function useListings() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    items,
    add: useCallback((l: MemberListing) => addListing(l), []),
    update: useCallback((id: string, patch: Partial<MemberListing>) => updateListing(id, patch), []),
    remove: useCallback((id: string) => removeListing(id), []),
  };
}

/** Human labels for each status (shared by filters + badges). */
export const STATUS_LABEL: Record<ListingStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  published: "Published",
  rejected: "Rejected",
};
