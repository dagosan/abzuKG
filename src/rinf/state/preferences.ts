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

export const SHOW_OPERATIONAL_POINTS_KEY = "rinf.showOperationalPoints";
export const SHOW_SECTIONS_OF_LINE_KEY = "rinf.showSectionsOfLine";

/** A remembered on/off choice; on by default. Storage can be blocked, so failures fall back. */
export const readShowPreference = (key: string): boolean => {
  try {
    return localStorage.getItem(key) !== "false";
  } catch {
    return true;
  }
};

export const writeShowPreference = (key: string, show: boolean): void => {
  try {
    localStorage.setItem(key, String(show));
  } catch {
    // Storage unavailable: the toggle still works for this session.
  }
};
