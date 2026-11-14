export type Role = "reporter" | "helper" | "missionary" | "admin";

export type ReportStatus =
  | "reported"
  | "claimed"
  | "needs_bed"
  | "placed"
  | "closed";

export type Report = {
  id: string;
  code: string;
  created_at: string;
  updated_at: string;
  lat: number;
  lng: number;
  people_count: number;
  needs: string[];
  note: string | null;
  contact: string | null;
  urgent: boolean;
  status: ReportStatus;
  reporter: string | null;
  helper: string | null;
  claimed_at: string | null;
  shelter_id: string | null;
  outcome: string | null;
  placed_at: string | null;
};

export type Shelter = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  total_beds: number;
  beds_available: number;
  open_tonight: boolean;
  owner: string | null;
  updated_at: string;
};

export type ReportEvent = {
  id: number;
  report_id: string;
  at: string;
  actor: string | null;
  role: string | null;
  action: string;
  detail: string | null;
};

export type ColdMode = "auto" | "on" | "off";

export const STATUS_COLORS: Record<ReportStatus, string> = {
  reported: "#dc2626",
  claimed: "#f59e0b",
  needs_bed: "#9333ea",
  placed: "#16a34a",
  closed: "#6b7280",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  reported: "Reported",
  claimed: "Helper En Route",
  needs_bed: "Needs a Bed",
  placed: "Placed",
  closed: "Closed",
};

export const NEEDS = ["blanket", "food", "water", "clothing", "medical"] as const;

/** A claim older than this is treated as stale and can be taken by another helper. */
export const CLAIM_TTL_MS = 2 * 60 * 60 * 1000;

export type Session = { username: string; role: Role; name: string };
