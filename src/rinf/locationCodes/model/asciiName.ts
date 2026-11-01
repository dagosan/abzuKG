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

Added for the ERA RINF frontend, 2026-11-02. */

/** Letters NFD does not split into a base letter and accents. */
const SPECIAL_LETTERS: Record<string, string> = {
  ß: "ss",
  Æ: "AE",
  æ: "ae",
  Œ: "OE",
  œ: "oe",
  Ø: "O",
  ø: "o",
  Ł: "L",
  ł: "l",
  Đ: "D",
  đ: "d",
  Ð: "D",
  ð: "d",
  Þ: "Th",
  þ: "th",
  ı: "i",
  "’": "'",
  "‘": "'",
  "–": "-",
  "—": "-",
};
const COMBINING_MARKS = /[̀-ͯ]/g;
const NOT_PRINTABLE_ASCII = /[^\x20-\x7e]/g;

/**
 * CRD's Location_Name_ASCII made from the name: "Grimsås" → "Grimsas",
 * "Hst außer Betrieb" → "Hst ausser Betrieb". Letters with no Latin
 * equivalent (Greek, Cyrillic) are dropped: such names need the ASCII form
 * typed in.
 */
export const asciiName = (name: string): string =>
  [...name.normalize("NFD")]
    .map((character) => SPECIAL_LETTERS[character] ?? character)
    .join("")
    .replace(COMBINING_MARKS, "")
    .replace(NOT_PRINTABLE_ASCII, "")
    .replace(/\s+/g, " ")
    .trim();

/** Printable ASCII only. */
export const isAscii = (text: string): boolean =>
  !new RegExp(NOT_PRINTABLE_ASCII.source).test(text);
