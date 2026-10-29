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

import { ERA_NAMESPACE } from "./queryParts";

const PROPERTY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
const DATASET_CODE_PATTERN = /^[A-Z0-9]{4}$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{3}$/;
const COUNTRY_AUTHORITY =
  "http://publications.europa.eu/resource/authority/country/";
/** Each IM publishes its data in a named graph named by its organisation code. */
const DATASET_PREFIX = `${ERA_NAMESPACE}graph/`;

/** Elements of an older model generation, kept out of every search. */
export const OLDER_MODEL_FILTER = `FILTER(!STRSTARTS(STR(?element), "${ERA_NAMESPACE}functionalInfrastructure/"))`;

/** A vocabulary local name, checked because it is written into the query. */
export const safeProperty = (property: string): string => {
  if (!PROPERTY_PATTERN.test(property)) {
    throw new Error(`Not a usable parameter name: "${property}"`);
  }
  return property;
};

const checked = (codes: string[], pattern: RegExp, what: string): string[] =>
  codes.map((code) => {
    if (!pattern.test(code)) throw new Error(`Not a usable ${what}: "${code}"`);
    return code;
  });

/** VALUES limiting ?dataset to the given IM datasets; nothing when null (all of them). */
export const datasetValues = (datasets: string[] | null): string =>
  datasets === null
    ? ""
    : `VALUES ?dataset { ${checked(datasets, DATASET_CODE_PATTERN, "IM code")
        .map((code) => `<${DATASET_PREFIX}${code}>`)
        .join(" ")} }`;

/** VALUES limiting ?country to the given countries; nothing when none are chosen. */
export const countryValues = (countries: string[]): string =>
  countries.length === 0
    ? ""
    : `VALUES ?country { ${checked(
        countries,
        COUNTRY_CODE_PATTERN,
        "country code",
      )
        .map((code) => `<${COUNTRY_AUTHORITY}${code}>`)
        .join(" ")} }`;
