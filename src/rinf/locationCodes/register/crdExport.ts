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

import type { CodeVersion } from "../model/CodeVersion";
import { isActiveOn } from "../model/codeVersions";

/** CRD's location table header, as in its export ("All CRD PLCs"). */
export const CRD_COLUMNS = [
  "Country_ISO_code",
  "Primary_Location_Code",
  "Start_Validity",
  "End_Validity",
  "Responsible_IM_Code",
  "Location_Name",
  "Location_Name_ASCII",
  "NUTS_Code",
  "Container_Handling_Flag",
  "Handover_Point_Flag",
  "Freight_Possible_Flag",
  "Freight_Start_Validity",
  "Freight_End_Validity",
  "Passenger_Possible_Flag",
  "Passenger_Start_Validity",
  "Passenger_End_Validity",
  "Latitude",
  "Longitude",
  "Free_Text",
  "Active_Flag",
  "Add_Date",
  "Mod_Date",
] as const;

const COUNTRY_LENGTH = 2;
const TIMESTAMP_LENGTH = 19;
const NEEDS_QUOTES = /[",\n\r]/;

/** CRD writes the number alone: BE00438 → "438". */
export const crdLocationNumber = (code: string): string =>
  String(Number(code.slice(COUNTRY_LENGTH)));

/** "2026-11-02T08:15:00.000Z" → "2026-11-02 08:15:00", as CRD's Add_Date. */
const crdTimestamp = (isoInstant: string): string =>
  isoInstant.slice(0, TIMESTAMP_LENGTH).replace("T", " ");

const flag = (value: boolean): string => (value ? "1" : "0");

const number = (value: number | null): string =>
  value === null ? "" : String(value);

const quoted = (value: string): string =>
  NEEDS_QUOTES.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/** One CRD row for a PLC version. */
export const crdRow = (version: CodeVersion, today: string): string[] => [
  version.countryIsoCode,
  crdLocationNumber(version.code),
  version.startValidity ?? "",
  version.endValidity ?? "",
  version.responsibleImCode,
  version.locationName,
  version.locationNameAscii,
  version.nutsCode,
  flag(version.containerHandlingFlag),
  flag(version.handoverPointFlag),
  flag(version.freightPossibleFlag),
  version.freightStartValidity ?? "",
  version.freightEndValidity ?? "",
  flag(version.passengerPossibleFlag),
  version.passengerStartValidity ?? "",
  version.passengerEndValidity ?? "",
  number(version.latitude),
  number(version.longitude),
  version.freeText,
  flag(isActiveOn(version, today)),
  crdTimestamp(version.addDate),
  crdTimestamp(version.modDate),
];

/**
 * The register's PLCs in CRD's CSV format: same columns and order, comma
 * separated, quotes only where needed, one row per version. SLCs are not in
 * CRD's PLC table and are left out.
 */
export const crdCsv = (
  versions: readonly CodeVersion[],
  today: string,
): string =>
  [
    CRD_COLUMNS.join(","),
    ...versions
      .filter((version) => version.codeType === "primary")
      .sort(
        (first, second) =>
          first.key.localeCompare(second.key) || first.version - second.version,
      )
      .map((version) => crdRow(version, today).map(quoted).join(",")),
  ].join("\n") + "\n";
