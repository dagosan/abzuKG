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

import {
  FIRST_LOCATION_NUMBER,
  LAST_LOCATION_NUMBER,
} from "../model/codeFormat";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FLAG_PATTERN = /^[01]$/;
const COMPANY_CODE_PATTERN = /^\d{4}$/;
const LOCATION_NUMBER_PATTERN = /^\d{1,5}$/;
const TYPE_CODE_PATTERN = /^\d{1,2}$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
/** Decimal degrees with a point, up to six decimals (Annex A.2). */
const DECIMAL_DEGREES_PATTERN = /^-?\d{1,3}(\.\d{1,6})?$/;
/** Words written where a field should be left empty (Annex A.1). */
const NULL_WORD_PATTERN = /^(null|n\/a)$/i;
const TYPE_CODE_LENGTH = 2;

export const NAME_MAX_LENGTH = 255;
export const FREE_TEXT_MAX_LENGTH = 255;
export const JUSTIFICATION_MAX_LENGTH = 1000;
export const NUTS_MAX_LENGTH = 50;
export const MAX_LATITUDE = 90;
export const MAX_LONGITUDE = 180;

/** YYYY-MM-DD naming a day that exists. */
export const isIsoDate = (value: string): boolean =>
  DATE_PATTERN.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

export const isFlag = (value: string): boolean => FLAG_PATTERN.test(value);

export const isCompanyCode = (value: string): boolean =>
  COMPANY_CODE_PATTERN.test(value);

export const isCountryCode = (value: string): boolean =>
  COUNTRY_PATTERN.test(value);

export const isNullWord = (value: string): boolean =>
  NULL_WORD_PATTERN.test(value);

/** "438" or "00438" → 438; null when not a whole number from 1 to 99999. */
export const locationNumberOf = (value: string): number | null => {
  if (!LOCATION_NUMBER_PATTERN.test(value)) return null;
  const locationNumber = Number(value);
  return locationNumber >= FIRST_LOCATION_NUMBER &&
    locationNumber <= LAST_LOCATION_NUMBER
    ? locationNumber
    : null;
};

/** "1" or "01" → "01"; null when not one or two digits. */
export const typeCodeOf = (value: string): string | null =>
  TYPE_CODE_PATTERN.test(value) ? value.padStart(TYPE_CODE_LENGTH, "0") : null;

export const isDecimalDegrees = (value: string, limit: number): boolean =>
  DECIMAL_DEGREES_PATTERN.test(value) && Math.abs(Number(value)) <= limit;
