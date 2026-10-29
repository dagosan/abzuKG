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

/** How a parameter's value is compared. */
export type ConditionOperator =
  | "is"
  | "equals"
  | "greaterOrEqual"
  | "lessOrEqual"
  | "contains"
  | "isTrue"
  | "isFalse"
  | "hasValue"
  | "notApplicable"
  | "notYetAvailable";

export const CONDITION_OPERATORS: ConditionOperator[] = [
  "is",
  "equals",
  "greaterOrEqual",
  "lessOrEqual",
  "contains",
  "isTrue",
  "isFalse",
  "hasValue",
  "notApplicable",
  "notYetAvailable",
];

/** Operators that need no value typed or picked. */
export const VALUELESS_OPERATORS: ConditionOperator[] = [
  "isTrue",
  "isFalse",
  "hasValue",
  "notApplicable",
  "notYetAvailable",
];

/** One parameter search, as it is kept in the page address. */
export interface ParameterCriteria {
  /** Local name in the ERA vocabulary, e.g. "maximumPermittedSpeed". */
  property: string;
  operator: ConditionOperator;
  /** A code's URI, a number or text, depending on the operator; "" when none is needed. */
  value: string;
  /** ISO 3166 alpha-3 codes, e.g. ["BEL", "NLD"]; empty means every country. */
  countries: string[];
  /** IM organisation codes, e.g. ["0088"]; empty means every IM. */
  infrastructureManagers: string[];
}

const PROPERTY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
const COUNTRY_PATTERN = /^[A-Z]{3}$/;
const IM_CODE_PATTERN = /^[A-Z0-9]{4}$/;
const LIST_SEPARATOR = ",";
const PARAM = {
  property: "parameter",
  operator: "condition",
  value: "value",
  countries: "country",
  infrastructureManagers: "im",
} as const;

const readList = (raw: string | null, pattern: RegExp): string[] =>
  (raw ?? "")
    .split(LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter((item) => pattern.test(item));

export const needsValue = (operator: ConditionOperator): boolean =>
  !VALUELESS_OPERATORS.includes(operator);

/** True when the criteria can be run: a parameter, and a value if the operator needs one. */
export const isComplete = ({ property, operator, value }: ParameterCriteria) =>
  PROPERTY_PATTERN.test(property) && (!needsValue(operator) || value !== "");

export const criteriaToSearchParams = (
  criteria: ParameterCriteria,
): URLSearchParams => {
  const params = new URLSearchParams();
  params.set(PARAM.property, criteria.property);
  params.set(PARAM.operator, criteria.operator);
  if (criteria.value) params.set(PARAM.value, criteria.value);
  if (criteria.countries.length > 0) {
    params.set(PARAM.countries, criteria.countries.join(LIST_SEPARATOR));
  }
  if (criteria.infrastructureManagers.length > 0) {
    params.set(
      PARAM.infrastructureManagers,
      criteria.infrastructureManagers.join(LIST_SEPARATOR),
    );
  }
  return params;
};

/** Reads criteria from the address; anything malformed is dropped, not trusted. */
export const criteriaFromSearchParams = (
  params: URLSearchParams,
): ParameterCriteria => {
  const property = params.get(PARAM.property) ?? "";
  const operator = params.get(PARAM.operator) as ConditionOperator | null;
  return {
    property: PROPERTY_PATTERN.test(property) ? property : "",
    operator:
      operator && CONDITION_OPERATORS.includes(operator) ? operator : "is",
    value: params.get(PARAM.value) ?? "",
    countries: readList(params.get(PARAM.countries), COUNTRY_PATTERN),
    infrastructureManagers: readList(
      params.get(PARAM.infrastructureManagers),
      IM_CODE_PATTERN,
    ),
  };
};

/** One string per distinct search, to tell whether results are still current. */
export const criteriaKey = (criteria: ParameterCriteria): string =>
  criteriaToSearchParams(criteria).toString();
