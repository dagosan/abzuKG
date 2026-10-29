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

/** Route segment of the location code workflow. */
export const LOCATION_CODES_ROUTE = "location-codes";
export const LOCATION_CODES_PATH = `/${LOCATION_CODES_ROUTE}`;

/** Sub-routes: the new request form and one request file. */
export const NEW_REQUEST_SEGMENT = "new";
export const REGISTER_SEGMENT = "register";
export const REQUEST_ID_PARAM = "requestId";

export const newRequestPath = (prefill?: URLSearchParams): string =>
  `${LOCATION_CODES_PATH}/${NEW_REQUEST_SEGMENT}${prefill ? `?${prefill}` : ""}`;

export const registerPath = `${LOCATION_CODES_PATH}/${REGISTER_SEGMENT}`;

export const requestPath = (requestId: string): string =>
  `${LOCATION_CODES_PATH}/${encodeURIComponent(requestId)}`;

export const isLocationCodesPath = (pathname: string): boolean =>
  pathname === LOCATION_CODES_PATH ||
  pathname.startsWith(`${LOCATION_CODES_PATH}/`);

/** Query parameters that pre-fill the form, e.g. from an OP's panel. */
export const PREFILL_PARAMS = {
  operationalPoint: "op",
  name: "name",
  country: "country",
} as const;
