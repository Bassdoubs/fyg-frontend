export interface GlobalStats {
  totalParkings: number;
  totalAirports: number;
  totalCompanies: number;
  totalCountries: number;
  countries: string[];
  countryCounts: { code: string; count: number }[];
}

export interface CountryStats {
  name: string;
  codes: string[];
  count: number;
  primaryCode: string;
}

export interface MapInfo {
  hasMap: boolean;
  mapUrl?: string;
  source?: string;
}

export interface Parking {
  _id: string;
  airline: string;
  airport: string;
  gate: {
    terminal: string;
    porte: string;
  };
  mapInfo?: MapInfo;
  createdAt: string;
  updatedAt: string;
}

export interface Airline {
  _id: string;
  name: string;
  callsign?: string;
  icao: string;
  country: string;
  logoUrl?: string | null;
  logoPublicId?: string | null;
}

export interface ProcessedAirline extends Omit<Airline, '_id'> {
  id: string;
  servedAirports: string[];
  parkingCount: number;
}

export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
  airlines?: T[];
}