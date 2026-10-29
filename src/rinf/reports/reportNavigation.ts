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

/** Navigation state marking a details panel opened from the report or its map view. */
export const FROM_REPORT_STATE = { fromReport: true } as const;

/** True when the page was opened with FROM_REPORT_STATE, so it can lead back. */
export const cameFromReport = (state: unknown): boolean =>
  typeof state === "object" &&
  state !== null &&
  (state as { fromReport?: unknown }).fromReport === true;
