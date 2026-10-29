/*
 *  Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

  https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence.

Added for the ERA RINF frontend, 2026-10-29. */

import type { StakeholderCategory } from "./stakeholderCategories";

/** Parties TD 103, Table 6 names as entitled to request a subsidiary type. */
export type EntitledParty =
  | "infrastructureManager"
  | "railwayUndertaking"
  | "stationManager"
  | "terminalManager"
  | "owner";

export interface SubsidiaryType {
  /** Two-digit type code, e.g. "01". */
  code: string;
  /** Name as TD 103 gives it; reference data, so not translated. */
  name: string;
  /** Empty when TD 103 names no party. */
  entitled: EntitledParty[];
}

const IM: EntitledParty = "infrastructureManager";
const RU: EntitledParty = "railwayUndertaking";
const STATION_MANAGER: EntitledParty = "stationManager";
const OWNER: EntitledParty = "owner";

/**
 * TD 103 v4.0, Table 6, without 00 "not defined". 39 and 40 name no party in
 * TD 103; the procedure (Table 6 extract) gives the RU, followed here.
 */
export const SUBSIDIARY_TYPES: SubsidiaryType[] = [
  { code: "01", name: "Track", entitled: [IM] },
  { code: "03", name: "Border point", entitled: [RU] },
  { code: "04", name: "Sorting code", entitled: [IM, RU] },
  { code: "05", name: "Vehicle parking point", entitled: [IM] },
  { code: "06", name: "Public loading place", entitled: [IM] },
  { code: "07", name: "Private siding", entitled: [OWNER] },
  { code: "09", name: "Depot", entitled: [OWNER] },
  { code: "10", name: "Switch / turnout", entitled: [IM] },
  { code: "15", name: "Platform", entitled: [STATION_MANAGER, IM] },
  { code: "22", name: "Level crossing", entitled: [IM] },
  { code: "23", name: "Bridge", entitled: [IM] },
  { code: "24", name: "Tunnel", entitled: [IM] },
  { code: "25", name: "Underpass", entitled: [STATION_MANAGER, IM] },
  { code: "27", name: "Signal", entitled: [IM] },
  { code: "28", name: "Sign and board", entitled: [IM] },
  { code: "29", name: "Phase break", entitled: [IM] },
  { code: "33", name: "Hot spot detector", entitled: [IM] },
  { code: "36", name: "Freight yard", entitled: [RU] },
  { code: "37", name: "Loading point", entitled: [RU] },
  { code: "39", name: "Reservation code", entitled: [RU] },
  { code: "40", name: "Meta station", entitled: [RU] },
  { code: "41", name: "Company specific identifier", entitled: [OWNER] },
  { code: "42", name: "DIUM station", entitled: [RU] },
  { code: "43", name: "Passengers' cars loading", entitled: [OWNER] },
  { code: "45", name: "Sewage dump", entitled: [OWNER] },
  { code: "46", name: "Refuelling point", entitled: [OWNER] },
  { code: "47", name: "Mains supply", entitled: [OWNER] },
  { code: "48", name: "Water supply", entitled: [OWNER] },
  { code: "50", name: "Indoor cleaning platform", entitled: [OWNER] },
  { code: "51", name: "Car-wash plant", entitled: [OWNER] },
  { code: "52", name: "Short dry-cleaning track", entitled: [OWNER] },
  { code: "54", name: "Sand-filling station", entitled: [OWNER] },
  { code: "56", name: "Signal box", entitled: [IM] },
  { code: "57", name: "Intermodal terminal", entitled: [OWNER] },
  { code: "58", name: "OSJD system based location", entitled: [RU] },
  { code: "59", name: "Train service substitute stop", entitled: [OWNER] },
  {
    code: "60",
    name: "Multifunctional rail terminal",
    entitled: ["terminalManager", IM],
  },
  { code: "61", name: "Relief facility", entitled: [IM] },
  { code: "70", name: "Network border", entitled: [IM] },
  { code: "71", name: "State border", entitled: [IM] },
  { code: "72", name: "Administrative border", entitled: [IM] },
  { code: "74", name: "Operational handover", entitled: [IM] },
  { code: "75", name: "Planning handover", entitled: [IM] },
  { code: "76", name: "Stopping point", entitled: [IM] },
  { code: "99", name: "Relation to station", entitled: [] },
];

export const findSubsidiaryType = (code: string): SubsidiaryType | null =>
  SUBSIDIARY_TYPES.find((type) => type.code === code) ?? null;

/** Requester categories that count as each entitled party. */
const CATEGORIES_OF_PARTY: Record<EntitledParty, StakeholderCategory[]> = {
  infrastructureManager: ["infrastructureManager"],
  railwayUndertaking: ["railwayUndertaking"],
  stationManager: ["stationManager"],
  terminalManager: [
    "freightServiceFacilityOperator",
    "intermodalTransportOperator",
  ],
  // Ownership cannot be read from the category; it is confirmed by hand.
  owner: [],
};

export type EntitlementOutcome = "entitled" | "confirmOwnership" | "consult";

/**
 * Whether the requester is the party TD 103 names for the type. Not being it
 * is never a ground for rejection (procedure 6.7): the Agency consults that
 * party instead.
 */
export const entitlementOf = (
  type: SubsidiaryType,
  category: StakeholderCategory,
): EntitlementOutcome => {
  const matches = type.entitled.some((party) =>
    CATEGORIES_OF_PARTY[party].includes(category),
  );
  if (matches) return "entitled";
  if (type.entitled.includes(OWNER)) return "confirmOwnership";
  return "consult";
};
