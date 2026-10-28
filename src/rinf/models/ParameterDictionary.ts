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

import type { SparqlBinding } from "../api/sparqlClient";
import { capitalise, humanizeLocalName } from "./labels";
import { unitSymbol } from "./units";

export interface TermDefinition {
  label: string;
  /** RINF index from the ERA vocabulary, e.g. "1.1.1.1.2.5"; null if the term has none. */
  rinfIndex: string | null;
  /** Display symbol, e.g. "km/h"; null if the term has no unit. */
  unit: string | null;
}

/** Keyed by term URI (property or class). */
export type ParameterDictionary = Record<string, TermDefinition>;

export const toParameterDictionary = (
  bindings: SparqlBinding[],
): ParameterDictionary =>
  Object.fromEntries(
    bindings
      .filter((binding) => binding.term?.value)
      .map((binding) => [
        binding.term!.value,
        {
          label: binding.label?.value
            ? capitalise(binding.label.value)
            : humanizeLocalName(binding.term!.value),
          rinfIndex: binding.rinfIndex?.value || null,
          unit: binding.unit?.value ? unitSymbol(binding.unit.value) : null,
        },
      ]),
  );

/** The term's definition, or one made from its URI when the vocabulary has none. */
export const defineTerm = (
  dictionary: ParameterDictionary,
  uri: string,
): TermDefinition =>
  dictionary[uri] ?? {
    label: humanizeLocalName(uri),
    rinfIndex: null,
    unit: null,
  };

/**
 * Orders by RINF index, part by part ("1.1.1.1.2.10" after "1.1.1.1.2.9"),
 * then terms without an index by label.
 */
export const compareByRinfIndex = (
  first: TermDefinition,
  second: TermDefinition,
): number => {
  if (first.rinfIndex && !second.rinfIndex) return -1;
  if (!first.rinfIndex && second.rinfIndex) return 1;
  if (first.rinfIndex && second.rinfIndex) {
    const byIndex = first.rinfIndex.localeCompare(second.rinfIndex, "en", {
      numeric: true,
    });
    if (byIndex !== 0) return byIndex;
  }
  return first.label.localeCompare(second.label, "en");
};
