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

/** Five-digit location number after the country prefix (TD 103 4.10.1). */
export const LOCATION_NUMBER_DIGITS = 5;
export const FIRST_LOCATION_NUMBER = 1;
export const LAST_LOCATION_NUMBER = 99999;

const PRIMARY_CODE_PATTERN = /^([A-Z]{2})(\d{5})$/;

/** TSI LocationSubsidiaryCode: up to ten letters and digits. */
export const SUBSIDIARY_CODE_MAX_LENGTH = 10;
const SUBSIDIARY_CODE_PATTERN = /^[A-Za-z0-9.\-]{1,10}$/;

/** Separates parent and subsidiary code in a register key: "BE00438/0001". */
const KEY_SEPARATOR = "/";

export interface PrimaryCodeParts {
  country: string;
  locationNumber: number;
}

export const formatPrimaryCode = (
  country: string,
  locationNumber: number,
): string =>
  `${country}${String(locationNumber).padStart(LOCATION_NUMBER_DIGITS, "0")}`;

export const parsePrimaryCode = (code: string): PrimaryCodeParts | null => {
  const match = PRIMARY_CODE_PATTERN.exec(code.trim().toUpperCase());
  if (!match) return null;
  return { country: match[1], locationNumber: Number(match[2]) };
};

export const normalisePrimaryCode = (code: string): string =>
  code.trim().toUpperCase();

/** Letters, digits, dots and hyphens (the KG has "NO-S.998"), at most ten. */
export const isValidSubsidiaryCode = (code: string): boolean =>
  SUBSIDIARY_CODE_PATTERN.test(code.trim());

export const subsidiaryKey = (
  parentPrimaryCode: string,
  subsidiaryCode: string,
): string =>
  `${normalisePrimaryCode(parentPrimaryCode)}${KEY_SEPARATOR}${subsidiaryCode.trim()}`;

/**
 * The lowest location number not in `used`, or null when the country is
 * full. Lowest, not highest + 1: several countries already use 99999.
 */
export const lowestFreeNumber = (
  used: ReadonlySet<number>,
  first = FIRST_LOCATION_NUMBER,
  last = LAST_LOCATION_NUMBER,
): number | null => {
  for (let candidate = first; candidate <= last; candidate++) {
    if (!used.has(candidate)) return candidate;
  }
  return null;
};

/** Lowest free numeric subsidiary code under a parent, zero-padded to ten. */
export const lowestFreeSubsidiaryCode = (
  usedCodes: readonly string[],
): string | null => {
  const used = new Set(
    usedCodes.filter((code) => /^\d+$/.test(code)).map(Number),
  );
  const free = lowestFreeNumber(used, 1, 10 ** SUBSIDIARY_CODE_MAX_LENGTH - 1);
  return free === null
    ? null
    : String(free).padStart(SUBSIDIARY_CODE_MAX_LENGTH, "0");
};
