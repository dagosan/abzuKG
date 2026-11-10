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
Modified 2026-10-30: Tiamat takes the workflow steps; this store only asks for them.
Modified 2026-11-02: register as code versions with CRD's columns.
Modified 2026-11-10: master data (countries, subsidiary types).
Modified 2026-11-10: request drafts. */

import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { CodeVersion } from "../model/CodeVersion";
import type { Country, SubsidiaryType } from "../model/masterData";
import type { RequestDraft } from "../model/RequestDraft";
import type {
  LocationCodeSnapshot,
  LocationCodeStore,
  StepResult,
} from "./LocationCodeStore";
import { currentAccessToken } from "../login/accessToken";
import {
  KG_UNAVAILABLE_ERROR,
  LOGIN_REQUIRED_ERROR,
  ROLE_NOT_HELD_ERROR,
  STALE_ERROR,
  UNREACHABLE_ERROR,
} from "./storeErrors";

const JSON_TYPE = "application/json";
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const CONFLICT = 409;
const UNAVAILABLE = 503;
const TEXT_KEY_PREFIX = "rinf_lc_";

/** Tiamat's error body (ext/era/locationcodes, LocationCodeController). */
interface RegisterError {
  error?: string;
  message?: string;
  details?: string[];
}

const STALE_ERRORS = ["staleRequest", "staleCode"];
/** Refusals whose detail is one of the frontend's text keys. */
const STEP_REFUSALS = ["actionNotAllowed", "actionNotAvailable"];

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
  if (response.status === UNAUTHORIZED) return new Error(LOGIN_REQUIRED_ERROR);
  if (response.status === FORBIDDEN) return new Error(ROLE_NOT_HELD_ERROR);
  if (response.status === CONFLICT && STALE_ERRORS.includes(body.error ?? ""))
    return new Error(STALE_ERROR);
  if (response.status === UNAVAILABLE) return new Error(KG_UNAVAILABLE_ERROR);
  const [firstDetail] = body.details ?? [];
  if (
    STEP_REFUSALS.includes(body.error ?? "") &&
    firstDetail?.startsWith(TEXT_KEY_PREFIX)
  )
    return new Error(firstDetail);
  const reasons = body.details?.length ? body.details.join("; ") : body.message;
  return new Error(reasons || `Tiamat answered ${response.status}`);
};

const BULK_NOT_IN_TIAMAT = "rinf_lc_bulk_error_not_in_tiamat";

/** Whose drafts: Tiamat uses it only when no login is set up. */
const ownerQuery = (owner: string): string =>
  `?owner=${encodeURIComponent(owner)}`;

/** The register kept in Tiamat, at e.g. https://…/era/v1/location-codes. */
export const createTiamatStore = (baseUrl: string): LocationCodeStore => {
  const root = baseUrl.replace(/\/+$/, "");

  const call = async (
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<Response> => {
    let response: Response;
    const token = await currentAccessToken();
    try {
      response = await fetch(`${root}${path}`, {
        method,
        headers: {
          Accept: JSON_TYPE,
          ...(body !== undefined && { "Content-Type": JSON_TYPE }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error(UNREACHABLE_ERROR);
    }
    if (!response.ok) throw await refusal(response);
    return response;
  };

  const read = async <Result>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<Result> =>
    (await (await call(path, method, body)).json()) as Result;

  return {
    loadRequests: () => read<LocationCodeRequest[]>("/requests"),
    loadCodes: () => read<CodeVersion[]>("/codes"),
    submitRequest: (data, actor, draftId) =>
      read<LocationCodeRequest>("/requests", "POST", {
        actor,
        data,
        ...(draftId && { draftId }),
      }),
    // The register in Tiamat takes one request per code; bulk requests are
    // so far tried out with the browser store only.
    submitBulk: () => Promise.reject(new Error(BULK_NOT_IN_TIAMAT)),
    registerBulk: () => Promise.reject(new Error(BULK_NOT_IN_TIAMAT)),
    loadDrafts: (owner) => read<RequestDraft[]>(`/drafts${ownerQuery(owner)}`),
    saveDraft: (id, data, owner) =>
      read<RequestDraft>(
        `/drafts/${encodeURIComponent(id)}${ownerQuery(owner)}`,
        "PUT",
        { data },
      ),
    deleteDraft: async (id, owner) => {
      await call(
        `/drafts/${encodeURIComponent(id)}${ownerQuery(owner)}`,
        "DELETE",
      );
    },
    takeStep: ({ requestId, action, actor, payload, expectedEventCount }) =>
      read<StepResult>(
        `/requests/${encodeURIComponent(requestId)}/actions`,
        "POST",
        { action, actor, payload, expectedEventCount },
      ),
    loadMasterData: async () => {
      const [countries, subsidiaryTypes] = await Promise.all([
        read<Country[]>("/countries"),
        read<SubsidiaryType[]>("/subsidiary-types"),
      ]);
      return { countries, subsidiaryTypes };
    },
    saveCountry: (country) =>
      read<Country>(
        `/countries/${encodeURIComponent(country.isoCode)}`,
        "PUT",
        country,
      ),
    saveSubsidiaryType: (type) =>
      read<SubsidiaryType>(
        `/subsidiary-types/${encodeURIComponent(type.code)}`,
        "PUT",
        type,
      ),
    exportSnapshot: () => read<LocationCodeSnapshot>("/snapshot"),
    importSnapshot: async (snapshot) => {
      await call("/import", "POST", snapshot);
    },
  };
};
