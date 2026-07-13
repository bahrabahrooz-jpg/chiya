export interface RangeVal {
  lo: number | null;
  hi: number | null;
  label: string;
  preset?: string;
  custom?: boolean;
}

export interface Filters {
  cities: string[];
  areas: string[];
  projects: string[];
  types: string[];
  price: RangeVal | null;
  size: RangeVal | null;
  beds: string;
  baths: string;
  amenities: string[];
  pstatus: string[];
}

export interface FilterHandlers {
  toggleCity: (v: string) => void;
  toggleArea: (v: string) => void;
  toggleProject: (v: string) => void;
  toggleType: (v: string) => void;
  setPrice: (p: RangeVal | null) => void;
  setSize: (p: RangeVal | null) => void;
  setBeds: (v: string) => void;
  setBaths: (v: string) => void;
  toggleAmenity: (v: string) => void;
  toggleStatus: (v: string) => void;
}

export const emptyFilters: Filters = {
  cities: [],
  areas: [],
  projects: [],
  types: [],
  price: null,
  size: null,
  beds: "",
  baths: "",
  amenities: [],
  pstatus: [],
};
