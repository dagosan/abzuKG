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

Added for the ERA RINF frontend, 2026-10-29.
Modified 2026-11-09: position pre-filled from a point chosen on the map.
Modified 2026-11-10: Master data view. */

/** Route segment of the location code workflow. */
export const LOCATION_CODES_ROUTE = "location-codes";
export const LOCATION_CODES_PATH = `/${LOCATION_CODES_ROUTE}`;

/** Sub-routes: the new request form and one request file. */
export const NEW_REQUEST_SEGMENT = "new";
export const REGISTER_SEGMENT = "register";
/** Bulk requests: a CSV file checked line by line (LCMS specification FR-08). */
export const BULK_SEGMENT = "bulk";
/** Countries and subsidiary types (LCMS specification FR-27). */
export const MASTER_DATA_SEGMENT = "master-data";
/** A requester's own requests. */
export const MY_REQUESTS_SEGMENT = "mine";
export const REQUEST_ID_PARAM = "requestId";

export const newRequestPath = (prefill?: URLSearchParams): string =>
  `${LOCATION_CODES_PATH}/${NEW_REQUEST_SEGMENT}${prefill ? `?${prefill}` : ""}`;

/** Back to the form being filled in, e.g. after picking on the map. */
export const RESUME_PARAM = "resume";
export const resumeRequestPath = `${LOCATION_CODES_PATH}/${NEW_REQUEST_SEGMENT}?${RESUME_PARAM}=1`;

/** Continues a saved draft in the form. */
export const DRAFT_PARAM = "draft";
export const draftPath = (draftId: string): string =>
  `${LOCATION_CODES_PATH}/${NEW_REQUEST_SEGMENT}?${DRAFT_PARAM}=${encodeURIComponent(draftId)}`;

export const registerPath = `${LOCATION_CODES_PATH}/${REGISTER_SEGMENT}`;

export const bulkPath = `${LOCATION_CODES_PATH}/${BULK_SEGMENT}`;

export const masterDataPath = `${LOCATION_CODES_PATH}/${MASTER_DATA_SEGMENT}`;

export const myRequestsPath = `${LOCATION_CODES_PATH}/${MY_REQUESTS_SEGMENT}`;

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
  latitude: "lat",
  longitude: "lng",
} as const;
