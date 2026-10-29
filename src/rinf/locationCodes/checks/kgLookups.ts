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

import { runSparqlSelect, SparqlBinding } from "../../api/sparqlClient";
import { canonicalIdFromUri, DetailsKind } from "../../detailsKinds";
import { localName, stripValidity } from "../../models/labels";
import { prefixOfCountry } from "../model/countries";
import {
  buildCountryCodesQuery,
  buildElementCodesQuery,
  buildPrimaryCodeQuery,
  buildSubsidiaryCodesQuery,
} from "./kgQueries";

/** A primary location code as the Knowledge Graph holds it. */
export interface KgPrimaryLocation {
  code: string;
  names: string[];
  /** Canonical ids of the OPs pointing at it. */
  operationalPoints: string[];
}

/** One IM's declaration of a RINF element, valid today. */
export interface KgDeclaration {
  /** Organisation code of the IM whose dataset declares it, e.g. "0088". */
  imCode: string;
  /** Code prefix of its country, e.g. "BE"; null when not known. */
  countryPrefix: string | null;
  name: string | null;
  codes: string[];
}

/** A RINF element as far as code positioning and the form need it. */
export interface KgElement {
  exists: boolean;
  validToday: boolean;
  label: string | null;
  /** Primary location codes on the version valid today; an OP may have several. */
  codes: string[];
  /** Each code's primary location name, e.g. FR06520 → "Lyon-Part-Dieu-Bât Voyageurs". */
  codeNames: Record<string, string>;
  /** One per declaring IM; two for a border point. */
  declarations: KgDeclaration[];
}

const unique = (values: (string | undefined)[]): string[] => [
  ...new Set(values.filter((value): value is string => Boolean(value))),
];

export const fetchCountryCodes = async (
  endpoint: string,
  country: string,
  signal?: AbortSignal,
): Promise<string[]> => {
  const rows = await runSparqlSelect(
    endpoint,
    buildCountryCodesQuery(country),
    signal,
  );
  return unique(rows.map((row) => row.code?.value));
};

/** The code in the KG, or null when no primary location carries it. */
export const fetchPrimaryLocation = async (
  endpoint: string,
  code: string,
  signal?: AbortSignal,
): Promise<KgPrimaryLocation | null> => {
  const rows = await runSparqlSelect(
    endpoint,
    buildPrimaryCodeQuery(code),
    signal,
  );
  if (rows.length === 0) return null;
  return {
    code,
    names: unique(rows.map((row) => row.name?.value)),
    operationalPoints: unique(
      rows.map((row) =>
        row.canonical
          ? (canonicalIdFromUri("operationalPoint", row.canonical.value) ??
            undefined)
          : row.uopid?.value,
      ),
    ),
  };
};

export const fetchSubsidiaryCodes = async (
  endpoint: string,
  primaryCode: string,
  signal?: AbortSignal,
): Promise<string[]> => {
  const rows = await runSparqlSelect(
    endpoint,
    buildSubsidiaryCodesQuery(primaryCode),
    signal,
  );
  return unique(rows.map((row) => row.code?.value));
};

/** "Gembloux (from … until …)" → "Gembloux". */
const labelOf = (label: string | undefined): string | null =>
  label ? stripValidity(label) : null;

const isValidOn = (
  from: string | undefined,
  to: string | undefined,
  isoDate: string,
): boolean => (!from || from <= isoDate) && (!to || to >= isoDate);

export const fetchElement = async (
  endpoint: string,
  kind: DetailsKind,
  canonicalId: string,
  today: string,
  signal?: AbortSignal,
): Promise<KgElement> => {
  const rows = await runSparqlSelect(
    endpoint,
    buildElementCodesQuery(kind, canonicalId),
    signal,
  );
  const validRows = rows.filter((row) =>
    isValidOn(row.from?.value, row.to?.value, today),
  );
  return {
    exists: rows.length > 0,
    validToday: validRows.length > 0,
    label: labelOf(validRows[0]?.label?.value ?? rows[0]?.label?.value),
    codes: unique(validRows.map((row) => row.code?.value)),
    codeNames: codeNamesOf(validRows),
    declarations: declarationsOf(validRows),
  };
};

const codeNamesOf = (rows: SparqlBinding[]): Record<string, string> =>
  Object.fromEntries(
    rows
      .filter((row) => row.code?.value && row.codeName?.value)
      .map((row) => [row.code!.value, row.codeName!.value]),
  );

/** The rows grouped by declaring IM (named graph …/graph/<code>). */
const declarationsOf = (rows: SparqlBinding[]): KgDeclaration[] =>
  unique(rows.map((row) => row.graph?.value)).map((graph) => {
    const own = rows.filter((row) => row.graph?.value === graph);
    const country = own.find((row) => row.country)?.country?.value;
    const uopid = own.find((row) => row.uopid)?.uopid?.value;
    const name = own.find((row) => row.name)?.name?.value;
    return {
      imCode: localName(graph),
      countryPrefix: prefixOfCountry(country, uopid),
      name: name ?? labelOf(own[0]?.label?.value),
      codes: unique(own.map((row) => row.code?.value)),
    };
  });
