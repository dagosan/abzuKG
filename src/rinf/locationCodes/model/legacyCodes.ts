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

Added for the ERA RINF frontend, 2026-11-02. */

import type { CodeType } from "./codeTypes";
import { asciiName } from "./asciiName";
import type { CodeVersion, VersionChange } from "./CodeVersion";
import { dayBefore } from "./codeVersions";
import type { RinfLink } from "./LocationCodeRequest";

/** A register entry as saved before 2026-11-02: one per code, no versions. */
interface LegacyCode {
  key: string;
  codeType: CodeType;
  code: string;
  parentPrimaryCode: string | null;
  country: string;
  name?: string;
  imOrganisationCode?: string;
  subsidiaryTypeCode?: string;
  rinfLink: RinfLink | null;
  validFrom: string;
  closedFrom: string | null;
  history: VersionChange[];
}

const isLegacyCode = (value: unknown): value is LegacyCode =>
  typeof value === "object" &&
  value !== null &&
  "history" in value &&
  !("version" in value);

/**
 * An entry saved before versions became its first and only version: the
 * request that assigned it opened it (none for a code first known from
 * the KG), a closure ended it. Amendments in
 * between are in Tiamat's change log, not here.
 */
const versionFromLegacy = (legacy: LegacyCode): CodeVersion => {
  const first = legacy.history[0] ?? null;
  const last = legacy.history[legacy.history.length - 1] ?? null;
  const name = legacy.name ?? "";
  return {
    key: legacy.key,
    version: 1,
    codeType: legacy.codeType,
    code: legacy.code,
    parentPrimaryCode: legacy.parentPrimaryCode,
    subsidiaryTypeCode: legacy.subsidiaryTypeCode ?? "",
    countryIsoCode: legacy.country,
    startValidity: legacy.validFrom || null,
    endValidity: legacy.closedFrom ? dayBefore(legacy.closedFrom) : null,
    responsibleImCode: legacy.imOrganisationCode ?? "",
    locationName: name,
    locationNameAscii: asciiName(name),
    nutsCode: "",
    containerHandlingFlag: false,
    handoverPointFlag: false,
    freightPossibleFlag: false,
    freightStartValidity: null,
    freightEndValidity: null,
    passengerPossibleFlag: false,
    passengerStartValidity: null,
    passengerEndValidity: null,
    latitude: null,
    longitude: null,
    freeText: "",
    addDate: first?.at ?? "",
    modDate: last?.at ?? "",
    rinfLink: legacy.rinfLink,
    openedBy: first?.change === "assigned" ? first : null,
    endedBy: last?.change === "closed" ? last : null,
  };
};

/** Codes from storage or a backup file, older entries turned into versions. */
export const upgradeCodes = (codes: readonly unknown[]): CodeVersion[] =>
  codes.map((code) =>
    isLegacyCode(code) ? versionFromLegacy(code) : (code as CodeVersion),
  );
