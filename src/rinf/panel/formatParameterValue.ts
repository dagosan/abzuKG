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

Added for the ERA RINF frontend, 2026-10-28. */

import type { ParameterValue } from "../models/SectionOfLineDetails";
import type { DisplayParameter } from "./visibleParameters";

const XSD = "http://www.w3.org/2001/XMLSchema#";
const NUMERIC_TYPES = new Set(
  [
    "double",
    "float",
    "decimal",
    "integer",
    "int",
    "long",
    "short",
    "nonNegativeInteger",
    "positiveInteger",
  ].map((type) => `${XSD}${type}`),
);
const BOOLEAN_TYPE = `${XSD}boolean`;
/** Enough for mm-level values given in metres; trailing zeros are dropped. */
const MAX_FRACTION_DIGITS = 4;

type FormatMessage = (descriptor: { id: string }) => string;

const isBoolean = ({ datatype, text, uri }: ParameterValue): boolean =>
  !uri && (datatype === BOOLEAN_TYPE || text === "true" || text === "false");

/** "1.95E2" → "195", "8.21E-1" → "0.821": RINF stores many numbers as doubles. */
const formatNumber = (text: string): string => {
  const number = Number(text);
  if (!Number.isFinite(number)) return text;
  return Number(number.toFixed(MAX_FRACTION_DIGITS)).toString();
};

const formatOne = (
  value: ParameterValue,
  unit: string | null,
  formatMessage: FormatMessage,
): string => {
  if (isBoolean(value)) {
    return formatMessage({
      id: value.text === "true" ? "rinf_boolean_true" : "rinf_boolean_false",
    });
  }
  const isNumber =
    !value.uri && !!value.datatype && NUMERIC_TYPES.has(value.datatype);
  const text = isNumber ? formatNumber(value.text) : value.text;
  return unit && isNumber ? `${text} ${unit}` : text;
};

/** The text shown for a parameter: its values with unit, or its RINF status. */
export const formatParameterValue = (
  parameter: DisplayParameter,
  formatMessage: FormatMessage,
): string[] => {
  if (parameter.status === "notApplicable") {
    return [formatMessage({ id: "rinf_not_applicable" })];
  }
  if (parameter.status === "notYetAvailable") {
    return [formatMessage({ id: "rinf_not_yet_available" })];
  }
  return parameter.values
    .map((value) => formatOne(value, parameter.unit, formatMessage))
    .sort((first, second) =>
      first.localeCompare(second, "en", { numeric: true }),
    );
};
