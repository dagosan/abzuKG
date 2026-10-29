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

import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";
import type {
  LocationCodeSnapshot,
  LocationCodeStore,
} from "./LocationCodeStore";

const JSON_TYPE = "application/json";
const CONFLICT = 409;
const UNAVAILABLE = 503;

/** Text keys shown when Tiamat refuses or cannot be reached. */
export const STALE_ERROR = "rinf_lc_error_store_stale";
export const UNREACHABLE_ERROR = "rinf_lc_error_store_unreachable";
export const KG_UNAVAILABLE_ERROR = "rinf_lc_error_store_kg_unavailable";

/** Tiamat's error body (ext/era/locationcodes, LocationCodeController). */
interface RegisterError {
  error?: string;
  message?: string;
  details?: string[];
}

const STALE_ERRORS = ["staleRequest", "staleCode"];

const readError = async (response: Response): Promise<RegisterError> => {
  try {
    return (await response.json()) as RegisterError;
  } catch {
    return {};
  }
};

/**
 * Turns a refusal into the error the workflow shows: a text key for the
 * cases with their own message, otherwise Tiamat's reasons as they are.
 */
const refusal = async (response: Response): Promise<Error> => {
  const body = await readError(response);
  if (response.status === CONFLICT && STALE_ERRORS.includes(body.error ?? ""))
    return new Error(STALE_ERROR);
  if (response.status === UNAVAILABLE) return new Error(KG_UNAVAILABLE_ERROR);
  const reasons = body.details?.length ? body.details.join("; ") : body.message;
  return new Error(reasons || `Tiamat answered ${response.status}`);
};

/** The register kept in Tiamat, at e.g. https://…/era/v1/location-codes. */
export const createTiamatStore = (baseUrl: string): LocationCodeStore => {
  const root = baseUrl.replace(/\/+$/, "");

  const call = async (
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<Response> => {
    let response: Response;
    try {
      response = await fetch(`${root}${path}`, {
        method,
        headers: {
          Accept: JSON_TYPE,
          ...(body !== undefined && { "Content-Type": JSON_TYPE }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error(UNREACHABLE_ERROR);
    }
    if (!response.ok) throw await refusal(response);
    return response;
  };

  const read = async <Result>(path: string): Promise<Result> =>
    (await (await call(path)).json()) as Result;

  const requestPath = (id: string) => `/requests/${encodeURIComponent(id)}`;

  return {
    loadRequests: () => read<LocationCodeRequest[]>("/requests"),
    saveRequest: async (request) => {
      await call(requestPath(request.id), "PUT", request);
    },
    saveRequestWithCodes: async (request, codes) => {
      await call(`${requestPath(request.id)}/with-codes`, "PUT", {
        request,
        codes,
      });
    },
    loadCodes: () => read<RegisteredCode[]>("/codes"),
    saveCodes: async (codes) => {
      await call("/codes", "PUT", codes);
    },
    nextReferenceSequence: async (year) => {
      const response = await call(`/reference-sequences/${year}/next`, "POST");
      const { value } = (await response.json()) as { value: number };
      return value;
    },
    exportSnapshot: () => read<LocationCodeSnapshot>("/snapshot"),
    importSnapshot: async (snapshot) => {
      await call("/import", "POST", snapshot);
    },
  };
};
