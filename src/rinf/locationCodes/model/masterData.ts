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

Added for the ERA Location Code Manager, 2026-11-10. */

/** Parties TD 103, Table 6 names as entitled to request a subsidiary type. */
export type EntitledParty =
  | "infrastructureManager"
  | "railwayUndertaking"
  | "stationManager"
  | "terminalManager"
  | "owner";

export const ENTITLED_PARTIES: EntitledParty[] = [
  "infrastructureManager",
  "railwayUndertaking",
  "stationManager",
  "terminalManager",
  "owner",
];

/** Dates are days (YYYY-MM-DD); null: no start, or no end. validTo is the last valid day. */
interface Validity {
  validFrom: string | null;
  validTo: string | null;
}

/** A country for which codes are assigned (LCMS specification 5.2). */
export interface Country extends Validity {
  /** ISO 3166 alpha-2, the prefix of its PLCs; "EU" for joint border points. */
  isoCode: string;
  /** UIC country code (code list B.9.1), two digits; null when there is none. */
  uicCode: string | null;
  name: string;
  /** False: uniqueness is confirmed with UIC/RNE before a decision (10.3). */
  euMemberState: boolean;
  /** Location numbers a new PLC may take. */
  plcRangeStart: number;
  plcRangeEnd: number;
}

/** A subsidiary location code type (LCMS specification 5.5). */
export interface SubsidiaryType extends Validity {
  /** Two-digit type code, e.g. "01". */
  code: string;
  /** Reference data, so not translated. */
  name: string;
  /** Empty when TD 103 names no party. */
  requesterRoles: EntitledParty[];
  /** Retail-related type (03, 39, 40; TD 103 4.10.1). */
  retailRelated: boolean;
}

export interface MasterData {
  countries: Country[];
  subsidiaryTypes: SubsidiaryType[];
}

/** `masterData` with the country added, or put in place of the one with its ISO code. */
export const withCountry = (
  masterData: MasterData,
  country: Country,
): MasterData => ({
  ...masterData,
  countries: [
    ...masterData.countries.filter(
      (other) => other.isoCode !== country.isoCode,
    ),
    country,
  ],
});

/** `masterData` with the type added, or put in place of the one with its code. */
export const withSubsidiaryType = (
  masterData: MasterData,
  type: SubsidiaryType,
): MasterData => ({
  ...masterData,
  subsidiaryTypes: [
    ...masterData.subsidiaryTypes.filter((other) => other.code !== type.code),
    type,
  ],
});

export const FIRST_RANGE_NUMBER = 1;
export const LAST_RANGE_NUMBER = 99999;
const NAME_MAX_LENGTH = 100;
const ISO_CODE_PATTERN = /^[A-Z]{2}$/;
const TWO_DIGITS_PATTERN = /^\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Valid on `day` (YYYY-MM-DD): started or without start, not ended or without end. */
export const isValidOn = (
  { validFrom, validTo }: Validity,
  day: string,
): boolean => (!validFrom || validFrom <= day) && (!validTo || validTo >= day);

/** Whether a location number lies in the country's range for new PLCs. */
export const isInRange = (country: Country, locationNumber: number): boolean =>
  locationNumber >= country.plcRangeStart &&
  locationNumber <= country.plcRangeEnd;

const isDate = (value: string): boolean =>
  DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));

const nameErrors = (name: string): string[] =>
  name.trim() === "" || name.trim().length > NAME_MAX_LENGTH
    ? ["rinf_lc_md_error_name"]
    : [];

const validityErrors = ({ validFrom, validTo }: Validity): string[] => {
  if ((validFrom && !isDate(validFrom)) || (validTo && !isDate(validTo)))
    return ["rinf_lc_md_error_dates"];
  return validFrom && validTo && validTo < validFrom
    ? ["rinf_lc_md_error_date_order"]
    : [];
};

const isRangeNumber = (value: number): boolean =>
  Number.isInteger(value) &&
  value >= FIRST_RANGE_NUMBER &&
  value <= LAST_RANGE_NUMBER;

const rangeErrors = ({ plcRangeStart, plcRangeEnd }: Country): string[] => {
  if (!isRangeNumber(plcRangeStart) || !isRangeNumber(plcRangeEnd))
    return ["rinf_lc_md_error_range"];
  return plcRangeStart > plcRangeEnd ? ["rinf_lc_md_error_range_order"] : [];
};

/** Text keys of what is wrong with a country; the register applies the same rules. */
export const countryErrors = (country: Country): string[] => [
  ...(ISO_CODE_PATTERN.test(country.isoCode) ? [] : ["rinf_lc_md_error_iso"]),
  ...(country.uicCode === null || TWO_DIGITS_PATTERN.test(country.uicCode)
    ? []
    : ["rinf_lc_md_error_uic"]),
  ...nameErrors(country.name),
  ...rangeErrors(country),
  ...validityErrors(country),
];

/** Text keys of what is wrong with a subsidiary type. */
export const subsidiaryTypeErrors = (type: SubsidiaryType): string[] => [
  ...(TWO_DIGITS_PATTERN.test(type.code) ? [] : ["rinf_lc_md_error_type_code"]),
  ...nameErrors(type.name),
  ...validityErrors(type),
];
