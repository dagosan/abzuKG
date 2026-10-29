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

/**
 * The 24 official languages of the Union (ISO 639-1); a request in any of
 * them is admissible (Article 74 of Regulation (EU) 2016/796).
 */
export const OFFICIAL_EU_LANGUAGES = [
  "bg",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "fi",
  "fr",
  "ga",
  "hr",
  "hu",
  "it",
  "lt",
  "lv",
  "mt",
  "nl",
  "pl",
  "pt",
  "ro",
  "sk",
  "sl",
  "sv",
];

export const DEFAULT_REQUEST_LANGUAGE = "en";

export const isOfficialEuLanguage = (language: string): boolean =>
  OFFICIAL_EU_LANGUAGES.includes(language);

/** Language name in the user's language, e.g. "German". */
export const languageName = (code: string, locale: string): string => {
  try {
    const names = new Intl.DisplayNames([locale], { type: "language" });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
};
