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

import type { ConditionOperator } from "../models/parameterCriteria";
import { isSafeIri, sparqlStringLiteral } from "./queryParts";
import { safeProperty } from "./scopePatterns";

const parseNumber = (value: string): number => {
  const number = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(number)) throw new Error(`Not a number: "${value}"`);
  return number;
};

const safeCode = (value: string): string => {
  if (!isSafeIri(value)) throw new Error(`Not a usable code: "${value}"`);
  return value;
};

/**
 * Graph pattern binding ?element to every element whose `property`
 * satisfies the condition. Values are checked or escaped before use.
 */
export const conditionPattern = (
  property: string,
  operator: ConditionOperator,
  value: string,
): string => {
  const parameter = `era:${safeProperty(property)}`;
  const withValue = (filter: string) =>
    `?element ${parameter} ?value . FILTER(${filter})`;

  switch (operator) {
    case "is":
      return `?element ${parameter} <${safeCode(value)}> .`;
    case "equals":
      return Number.isFinite(Number(value.trim().replace(",", ".")))
        ? withValue(`?value = ${parseNumber(value)}`)
        : withValue(`STR(?value) = ${sparqlStringLiteral(value)}`);
    case "greaterOrEqual":
      return withValue(`?value >= ${parseNumber(value)}`);
    case "lessOrEqual":
      return withValue(`?value <= ${parseNumber(value)}`);
    case "contains":
      return withValue(
        `CONTAINS(LCASE(STR(?value)), LCASE(${sparqlStringLiteral(value)}))`,
      );
    case "isTrue":
      return withValue(`STR(?value) = "true"`);
    case "isFalse":
      return withValue(`STR(?value) = "false"`);
    case "hasValue":
      return `?element ${parameter} ?value .`;
    case "notApplicable":
      return `?element era:notApplicable ${parameter} .`;
    case "notYetAvailable":
      return `?element era:notYetAvailable ${parameter} .`;
  }
};
