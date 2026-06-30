export interface RangeVal {
  lo: number | null;
  hi: number | null;
  label: string;
  preset?: string;
  custom?: boolean;
}

export interface Filters {
  types: string[];
  price: RangeVal | null;
  size: RangeVal | null;
  beds: string;
  baths: string;
  amenities: string[];
  pstatus: string[];
}

export interface FilterHandlers {
  toggleType: (v: string) => void;
  setPrice: (p: RangeVal | null) => void;
  setSize: (p: RangeVal | null) => void;
  setBeds: (v: string) => void;
  setBaths: (v: string) => void;
  toggleAmenity: (v: string) => void;
  toggleStatus: (v: string) => void;
}

export const emptyFilters: Filters = {
  types: [],
  price: null,
  size: null,
  beds: "",
  baths: "",
  amenities: [],
  pstatus: [],
};
