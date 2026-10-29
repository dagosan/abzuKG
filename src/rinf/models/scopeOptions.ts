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
import { localName } from "./labels";

/** An IM, known by its organisation code: the name of its dataset (named graph). */
export interface InfrastructureManagerOption {
  code: string;
  /** Alpha-3 codes of the countries its sections of line are in. */
  countries: string[];
  sections: number;
}

export interface CountryOption {
  code: string;
  name: string;
  sections: number;
}

export interface ScopeOptions {
  infrastructureManagers: InfrastructureManagerOption[];
  countries: CountryOption[];
}

/** Rows of (IM dataset, country) pairs with section counts, into the two option lists. */
export const toScopeOptions = (bindings: SparqlBinding[]): ScopeOptions => {
  const managers = new Map<string, InfrastructureManagerOption>();
  const countries = new Map<string, CountryOption>();

  bindings.forEach(({ graph, country, countryName, sections }) => {
    if (!graph?.value || !country?.value) return;
    const code = localName(graph.value);
    const countryCode = localName(country.value);
    const count = Number.parseInt(sections?.value ?? "0", 10);

    const manager = managers.get(code) ?? { code, countries: [], sections: 0 };
    manager.countries.push(countryCode);
    manager.sections += count;
    managers.set(code, manager);

    const entry = countries.get(countryCode) ?? {
      code: countryCode,
      name: countryName?.value || countryCode,
      sections: 0,
    };
    entry.sections += count;
    countries.set(countryCode, entry);
  });

  return {
    infrastructureManagers: [...managers.values()].sort(
      (first, second) => second.sections - first.sections,
    ),
    countries: [...countries.values()].sort((first, second) =>
      first.name.localeCompare(second.name, "en"),
    ),
  };
};

/**
 * The IM datasets a search has to look in. Chosen IMs are used as they are;
 * chosen countries add the IMs active there (each result's country is then
 * checked exactly). Null means every dataset.
 */
export const datasetsToSearch = (
  options: ScopeOptions,
  countries: string[],
  infrastructureManagers: string[],
): string[] | null => {
  if (infrastructureManagers.length > 0) return infrastructureManagers;
  if (countries.length === 0) return null;
  return options.infrastructureManagers
    .filter((manager) =>
      manager.countries.some((country) => countries.includes(country)),
    )
    .map((manager) => manager.code);
};
