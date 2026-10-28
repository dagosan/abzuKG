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

/** Versioned resources carry their period in the label: "Gembloux (from 2020-06-14 until 2078-12-31)". */
const VALIDITY_SUFFIX =
  /\s*\(from \d{4}-\d{2}-\d{2}( until \d{4}-\d{2}-\d{2})?\)\s*$/;
const SOL_LABEL_PREFIX = /^Section of Line\s+/i;

export const stripValidity = (label: string): string =>
  label.replace(VALIDITY_SUFFIX, "");

/** "Section of Line Gembloux - Chapelle-Dieu (from …)" → "Gembloux - Chapelle-Dieu". */
export const sectionOfLineName = (label: string): string =>
  stripValidity(label).replace(SOL_LABEL_PREFIX, "");

/** The part after the last "/" or "#": the readable end of a URI. */
export const localName = (uri: string): string => {
  const cut = Math.max(uri.lastIndexOf("/"), uri.lastIndexOf("#"));
  return cut >= 0 ? uri.slice(cut + 1) : uri;
};

/** Upper-cases the first letter only: "validity" → "Validity", "ETCS level" unchanged. */
export const capitalise = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** "maximumPermittedSpeed" → "Maximum permitted speed", for terms without a label. */
export const humanizeLocalName = (uri: string): string =>
  capitalise(
    localName(uri)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .toLowerCase(),
  );
