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

import type { SparqlBinding } from "../api/sparqlClient";
import type { ConditionOperator } from "./parameterCriteria";

/** What kind of value a parameter takes, told from the values actually in use. */
export type ValueKind = "code" | "number" | "boolean" | "text";

export interface ValueInUse {
  /** A code's URI, or the literal as stored. */
  value: string;
  label: string | null;
  uses: number;
  isCode: boolean;
  datatype: string | null;
}

const XSD = "http://www.w3.org/2001/XMLSchema#";
const NUMERIC_TYPES = new Set(
  ["double", "float", "decimal", "integer", "int", "long", "short"].map(
    (type) => `${XSD}${type}`,
  ),
);
const BOOLEAN_TYPE = `${XSD}boolean`;

const STATUS_OPERATORS: ConditionOperator[] = [
  "hasValue",
  "notApplicable",
  "notYetAvailable",
];

/** The operators offered for each kind, most useful first. */
export const OPERATORS_BY_KIND: Record<ValueKind, ConditionOperator[]> = {
  code: ["is", ...STATUS_OPERATORS],
  number: ["greaterOrEqual", "lessOrEqual", "equals", ...STATUS_OPERATORS],
  boolean: ["isTrue", "isFalse", ...STATUS_OPERATORS],
  text: ["contains", "equals", ...STATUS_OPERATORS],
};

export const toValuesInUse = (bindings: SparqlBinding[]): ValueInUse[] =>
  bindings
    .filter((binding) => binding.value?.value)
    .map(({ value, label, uses }) => ({
      value: value!.value,
      label: label?.value || null,
      uses: Number.parseInt(uses?.value ?? "0", 10),
      isCode: value!.type === "uri",
      datatype: value!.datatype ?? null,
    }));

/** The most common kind among the values; text when there are none to judge by. */
export const inferValueKind = (values: ValueInUse[]): ValueKind => {
  const kindOf = ({ isCode, datatype }: ValueInUse): ValueKind => {
    if (isCode) return "code";
    if (datatype && NUMERIC_TYPES.has(datatype)) return "number";
    if (datatype === BOOLEAN_TYPE) return "boolean";
    return "text";
  };
  const tally = new Map<ValueKind, number>();
  values.forEach((value) =>
    tally.set(kindOf(value), (tally.get(kindOf(value)) ?? 0) + value.uses),
  );
  const [mostUsed] = [...tally.entries()].sort(
    (first, second) => second[1] - first[1],
  );
  return mostUsed?.[0] ?? "text";
};
