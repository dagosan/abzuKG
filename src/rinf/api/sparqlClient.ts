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

const SPARQL_RESULTS_JSON = "application/sparql-results+json";
const FORM_ENCODED = "application/x-www-form-urlencoded";

export interface SparqlTerm {
  type: "uri" | "literal" | "bnode" | "typed-literal";
  value: string;
  datatype?: string;
  "xml:lang"?: string;
}

export type SparqlBinding = Record<string, SparqlTerm | undefined>;

interface SparqlSelectResponse {
  results: { bindings: SparqlBinding[] };
}

/**
 * Runs a SPARQL SELECT and returns its rows. POST keeps long queries out of
 * the URL; the endpoint allows cross-origin POST.
 */
export const runSparqlSelect = async (
  endpoint: string,
  query: string,
  signal?: AbortSignal,
): Promise<SparqlBinding[]> => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: SPARQL_RESULTS_JSON, "Content-Type": FORM_ENCODED },
    body: new URLSearchParams({ query }).toString(),
    signal,
  });
  if (!response.ok) {
    throw new Error(`SPARQL endpoint answered ${response.status}`);
  }
  const json = (await response.json()) as SparqlSelectResponse;
  return json.results.bindings;
};
