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

Added for the ERA RINF frontend, 2026-10-29.
Modified 2026-11-10: countries and subsidiary types come from the master data. */

import { todayIsoDate } from "../../api/queryParts";
import { EntitledParty, isValidOn, SubsidiaryType } from "./masterData";
import { currentMasterData } from "./masterDataRegistry";
import type { StakeholderCategory } from "./stakeholderCategories";

export type { EntitledParty, SubsidiaryType };

const OWNER: EntitledParty = "owner";
/** "Not defined": listed in the XSD, but not a type to ask a code for. */
const NOT_DEFINED_TYPE = "00";

/** Any listed type, also one no longer in use: codes registered under it keep its name. */
export const findSubsidiaryType = (code: string): SubsidiaryType | null =>
  currentMasterData().subsidiaryTypes.find((type) => type.code === code) ??
  null;

/** The types a new SLC can be asked for today (BR-08), by code. */
export const subsidiaryTypesInUse = (
  today = todayIsoDate(),
  subsidiaryTypes = currentMasterData().subsidiaryTypes,
): SubsidiaryType[] =>
  subsidiaryTypes
    .filter((type) => type.code !== NOT_DEFINED_TYPE && isValidOn(type, today))
    .sort((first, second) => first.code.localeCompare(second.code));

export const isSubsidiaryTypeInUse = (
  code: string,
  today = todayIsoDate(),
): boolean => subsidiaryTypesInUse(today).some((type) => type.code === code);

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
  const matches = type.requesterRoles.some((party) =>
    CATEGORIES_OF_PARTY[party].includes(category),
  );
  if (matches) return "entitled";
  if (type.requesterRoles.includes(OWNER)) return "confirmOwnership";
  return "consult";
};
