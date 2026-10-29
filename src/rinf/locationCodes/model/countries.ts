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

/**
 * Country prefixes of primary location codes. The ERA Knowledge Graph writes
 * codes as ISO 3166 alpha-2 plus five digits (e.g. "BE00438"), and "EU" for
 * some border points; that form is followed here. TD 103 4.10.1 describes a
 * two-digit numeric country code instead (code list B.9.1).
 */
export const EU_MEMBER_STATE_PREFIXES = [
  "AT",
  "BE",
  "BG",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
];

/** Border points declared jointly, e.g. EU00010. */
export const UNION_PREFIX = "EU";

/** Non-EU countries: uniqueness is confirmed with UIC/RNE first (10.3). */
export const NON_EU_PREFIXES = [
  "AL",
  "BA",
  "BY",
  "CH",
  "GB",
  "LI",
  "MD",
  "ME",
  "MK",
  "NO",
  "RS",
  "TR",
  "UA",
];

export const COUNTRY_PREFIXES = [
  ...EU_MEMBER_STATE_PREFIXES,
  UNION_PREFIX,
  ...NON_EU_PREFIXES,
];

export const isNonEuCountry = (prefix: string): boolean =>
  NON_EU_PREFIXES.includes(prefix);

export const isCountryPrefix = (prefix: string): boolean =>
  COUNTRY_PREFIXES.includes(prefix);

/** Country name in the user's language, e.g. "Belgium"; the prefix if unknown. */
export const countryName = (prefix: string, locale: string): string => {
  try {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return names.of(prefix) ?? prefix;
  } catch {
    return prefix;
  }
};

/** ISO 3166 alpha-3 (as in era:inCountry) to the code prefix used here. */
const PREFIX_OF_ALPHA3: Record<string, string> = {
  AUT: "AT",
  BEL: "BE",
  BGR: "BG",
  CZE: "CZ",
  DEU: "DE",
  DNK: "DK",
  EST: "EE",
  ESP: "ES",
  FIN: "FI",
  FRA: "FR",
  GRC: "GR",
  HRV: "HR",
  HUN: "HU",
  IRL: "IE",
  ITA: "IT",
  LTU: "LT",
  LUX: "LU",
  LVA: "LV",
  NLD: "NL",
  POL: "PL",
  PRT: "PT",
  ROU: "RO",
  SWE: "SE",
  SVN: "SI",
  SVK: "SK",
  ALB: "AL",
  BIH: "BA",
  BLR: "BY",
  CHE: "CH",
  GBR: "GB",
  LIE: "LI",
  MDA: "MD",
  MNE: "ME",
  MKD: "MK",
  NOR: "NO",
  SRB: "RS",
  TUR: "TR",
  UKR: "UA",
};

const UOPID_PREFIX_LENGTH = 2;

/**
 * The code prefix of an element's country: from era:inCountry (an EU
 * country authority URI ending in the alpha-3 code), else from the UOPID,
 * which starts with the alpha-2 code. Null when neither gives a known one.
 */
export const prefixOfCountry = (
  countryUri: string | undefined,
  uopid: string | undefined,
): string | null => {
  const alpha3 = countryUri?.split("/").pop() ?? "";
  const fromCountry = PREFIX_OF_ALPHA3[alpha3];
  if (fromCountry) return fromCountry;
  const fromUopid = uopid?.slice(0, UOPID_PREFIX_LENGTH).toUpperCase() ?? "";
  return isCountryPrefix(fromUopid) ? fromUopid : null;
};
