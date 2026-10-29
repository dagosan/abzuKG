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

Added for the ERA RINF frontend, 2026-10-28. 2026-10-29: location code routes. */

import { Route } from "react-router-dom";
import {
  CANONICAL_ID_PARAM,
  DETAILS_KIND_NAMES,
  DETAILS_KINDS,
} from "./detailsKinds";
import { DetailsPage } from "./pages/DetailsPage";
import { LegacySearchRedirect } from "./reports/LegacySearchRedirect";
import {
  LEGACY_PARAMETER_SEARCH_ROUTE,
  RINF_REPORTS_ROUTE,
} from "./reports/rinfReportsPath";
import { RinfReportsPage } from "./reports/RinfReportsPage";
import {
  LOCATION_CODES_ROUTE,
  MY_REQUESTS_SEGMENT,
  NEW_REQUEST_SEGMENT,
  REGISTER_SEGMENT,
  REQUEST_ID_PARAM,
} from "./locationCodes/page/locationCodesPath";
import {
  LocationCodesPage,
  LocationCodesPageMode,
} from "./locationCodes/page/LocationCodesPage";

/** Location code workflow routes, relative to /location-codes. */
const LOCATION_CODES_SUBROUTES: [string, LocationCodesPageMode][] = [
  ["", "home"],
  [`/${NEW_REQUEST_SEGMENT}`, "new"],
  [`/${REGISTER_SEGMENT}`, "register"],
  [`/${MY_REQUESTS_SEGMENT}`, "mine"],
  [`/:${REQUEST_ID_PARAM}`, "request"],
];

/**
 * The RINF routes, e.g. /operational-point/:canonicalId. A function, not a
 * component, because <Routes> only accepts <Route> elements as children:
 * App.tsx calls it inside its <Routes> with `{rinfRoutes(path)}`.
 */
export const rinfRoutes = (basePath: string) => [
  ...DETAILS_KIND_NAMES.map((kind) => (
    <Route
      key={kind}
      path={`${basePath}${DETAILS_KINDS[kind].route}/:${CANONICAL_ID_PARAM}`}
      element={<DetailsPage key={kind} kind={kind} />}
    />
  )),
  <Route
    key={RINF_REPORTS_ROUTE}
    path={`${basePath}${RINF_REPORTS_ROUTE}`}
    element={<RinfReportsPage />}
  />,
  <Route
    key={LEGACY_PARAMETER_SEARCH_ROUTE}
    path={`${basePath}${LEGACY_PARAMETER_SEARCH_ROUTE}`}
    element={<LegacySearchRedirect />}
  />,
  ...LOCATION_CODES_SUBROUTES.map(([subpath, mode]) => (
    <Route
      key={`${LOCATION_CODES_ROUTE}${subpath}`}
      path={`${basePath}${LOCATION_CODES_ROUTE}${subpath}`}
      element={<LocationCodesPage mode={mode} />}
    />
  )),
];
