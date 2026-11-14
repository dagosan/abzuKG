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

Added for the ERA Location Code Manager, 2026-11-14. */

/**
 * Version of the Location Code Manager: ERA's own number, apart from Abzu's
 * in package.json (which follows upstream). Raise it together with a new
 * entry at the top of CHANGELOG.md; version.test.ts checks the two agree.
 * deploy/update.sh reads this line for /version.txt: keep its form.
 */
export const LOCATION_CODE_MANAGER_VERSION = "0.9.0";

/** Where the change log can be read. */
export const CHANGELOG_URL =
  "https://github.com/dagosan/abzuKG/blob/master/CHANGELOG.md";
