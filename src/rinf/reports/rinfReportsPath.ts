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

/** Route segment of the RINF reports page; the search follows as ?parameter=…&… */
export const RINF_REPORTS_ROUTE = "rinf-reports";

export const RINF_REPORTS_PATH = `/${RINF_REPORTS_ROUTE}`;

/** Where the search lived before it moved to the reports page; old links redirect. */
export const LEGACY_PARAMETER_SEARCH_ROUTE = "parameter-search";

export const isRinfReportsPath = (pathname: string): boolean =>
  pathname === RINF_REPORTS_PATH;
