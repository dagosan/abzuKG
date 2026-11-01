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

/** NUTS_Code as CRD holds it: NUTS 3 ("AT112") or an older national code ("3099"). */
const NUTS_CODE_PATTERN = /^[A-Z0-9]{1,5}$/;
const COORDINATE_DECIMALS = 6;
const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;
export const FREE_TEXT_MAX_LENGTH = 255;

/** A coordinate as typed ("50,56013" too), or null when blank or not a number. */
export const parseCoordinate = (text: string): number | null => {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value)
    ? Number(value.toFixed(COORDINATE_DECIMALS))
    : null;
};

const isWithin = (text: string, limit: number): boolean => {
  const value = parseCoordinate(text);
  return value !== null && Math.abs(value) <= limit;
};

export const isLatitude = (text: string): boolean =>
  isWithin(text, MAX_LATITUDE);

export const isLongitude = (text: string): boolean =>
  isWithin(text, MAX_LONGITUDE);

export const normaliseNutsCode = (text: string): string =>
  text.trim().toUpperCase();

export const isNutsCode = (text: string): boolean =>
  NUTS_CODE_PATTERN.test(normaliseNutsCode(text));
