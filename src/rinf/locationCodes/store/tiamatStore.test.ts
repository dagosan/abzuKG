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
Modified 2026-10-30: the store submits and takes steps instead of saving documents.
Modified 2026-11-02: register as code versions with CRD's columns.
Modified 2026-11-10: master data. */

import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import type { CodeVersion } from "../model/CodeVersion";
import { DEFAULT_COUNTRIES } from "../model/defaultCountries";
import { DEFAULT_SUBSIDIARY_TYPES } from "../model/defaultSubsidiaryTypes";
import type { Actor } from "../model/roles";
import { parseBackup } from "./backupFile";
import type { WorkflowStep } from "./LocationCodeStore";
import {
  KG_UNAVAILABLE_ERROR,
  STALE_ERROR,
  UNREACHABLE_ERROR,
} from "./storeErrors";
import { createTiamatStore } from "./tiamatStore";

const BASE = "https://tiamat.test/era/v1/location-codes/";
const request = { id: "r 1", events: [] } as unknown as LocationCodeRequest;
const code = { key: "SE00001" } as unknown as CodeVersion;
const data = { country: "SE" } as unknown as RequestData;
const anna: Actor = { name: "Anna", role: "requester" };
const carl: Actor = { name: "Carl", role: "codeAdministrator" };
const publish: WorkflowStep = {
  requestId: "r 1",
  action: "publish",
  actor: carl,
  payload: { note: "" },
  expectedEventCount: 6,
  endpoint: "https://kg.test/sparql",
};

const answer = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const mockFetch = (response: Response | Error) => {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const sent = (fetchMock: ReturnType<typeof mockFetch>, call = 0) => {
  const [url, init] = fetchMock.mock.calls[call] as unknown as [
    string,
    RequestInit,
  ];
  return { url, method: init.method, body: init.body };
};

describe("tiamatStore", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("submits a request and returns the one Tiamat recorded", async () => {
    const fetchMock = mockFetch(answer(201, request));
    await expect(
      createTiamatStore(BASE).submitRequest(data, anna),
    ).resolves.toEqual(request);
    expect(sent(fetchMock)).toEqual({
      url: "https://tiamat.test/era/v1/location-codes/requests",
      method: "POST",
      body: JSON.stringify({ actor: anna, data }),
    });
  });

  it("asks Tiamat to take a step, without the KG endpoint", async () => {
    const fetchMock = mockFetch(answer(200, { request, codes: [code] }));
    await expect(createTiamatStore(BASE).takeStep(publish)).resolves.toEqual({
      request,
      codes: [code],
    });
    expect(sent(fetchMock)).toEqual({
      url: `${BASE}requests/r%201/actions`,
      method: "POST",
      body: JSON.stringify({
        action: "publish",
        actor: carl,
        payload: { note: "" },
        expectedEventCount: 6,
      }),
    });
  });

  it("asks to reload when someone else took a step first", async () => {
    mockFetch(
      answer(409, { error: "staleRequest", message: "x", details: [] }),
    );
    await expect(createTiamatStore(BASE).takeStep(publish)).rejects.toThrow(
      STALE_ERROR,
    );
  });

  it("shows why Tiamat refused a step in the frontend's own words", async () => {
    mockFetch(
      answer(422, {
        error: "actionNotAllowed",
        message: "actionNotAllowed: rinf_lc_blocked_four_eyes",
        details: ["rinf_lc_blocked_four_eyes"],
      }),
    );
    await expect(createTiamatStore(BASE).takeStep(publish)).rejects.toThrow(
      "rinf_lc_blocked_four_eyes",
    );
  });

  it("passes on the register's reasons", async () => {
    mockFetch(
      answer(422, {
        error: "codeRejected",
        message: "codeRejected: …",
        details: ["BE00438: already in the KG", "SE77777/1: no parent"],
      }),
    );
    await expect(createTiamatStore(BASE).takeStep(publish)).rejects.toThrow(
      "BE00438: already in the KG; SE77777/1: no parent",
    );
  });

  it("says when the Knowledge Graph or Tiamat cannot answer", async () => {
    mockFetch(answer(503, { error: "knowledgeGraphUnavailable" }));
    await expect(createTiamatStore(BASE).takeStep(publish)).rejects.toThrow(
      KG_UNAVAILABLE_ERROR,
    );
    mockFetch(new TypeError("Failed to fetch"));
    await expect(createTiamatStore(BASE).loadRequests()).rejects.toThrow(
      UNREACHABLE_ERROR,
    );
  });
});

describe("tiamatStore master data", () => {
  afterEach(() => vi.unstubAllGlobals());

  const belgium = DEFAULT_COUNTRIES.find(({ isoCode }) => isoCode === "BE");
  const [track] = DEFAULT_SUBSIDIARY_TYPES.filter(({ code }) => code === "01");

  it("reads countries and subsidiary types", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      answer(200, url.endsWith("/countries") ? [belgium] : [track]),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(createTiamatStore(BASE).loadMasterData()).resolves.toEqual({
      countries: [belgium],
      subsidiaryTypes: [track],
    });
    expect(fetchMock.mock.calls.map(([url]) => url).sort()).toEqual([
      "https://tiamat.test/era/v1/location-codes/countries",
      "https://tiamat.test/era/v1/location-codes/subsidiary-types",
    ]);
  });

  it("saves one entry under its key", async () => {
    if (!belgium) throw new Error("BE is missing");
    const fetchMock = mockFetch(answer(200, belgium));
    await expect(createTiamatStore(BASE).saveCountry(belgium)).resolves.toEqual(
      belgium,
    );
    expect(sent(fetchMock)).toEqual({
      url: "https://tiamat.test/era/v1/location-codes/countries/BE",
      method: "PUT",
      body: JSON.stringify(belgium),
    });
    const typeFetch = mockFetch(answer(200, track));
    await createTiamatStore(BASE).saveSubsidiaryType(track);
    expect(sent(typeFetch).url).toBe(
      "https://tiamat.test/era/v1/location-codes/subsidiary-types/01",
    );
  });

  it("passes on why the register refused an entry", async () => {
    if (!belgium) throw new Error("BE is missing");
    mockFetch(
      answer(409, {
        error: "duplicateUicCode",
        details: ["another country already has UIC code 88"],
      }),
    );
    await expect(createTiamatStore(BASE).saveCountry(belgium)).rejects.toThrow(
      "another country already has UIC code 88",
    );
  });
});

describe("parseBackup", () => {
  it("accepts a backup and fills missing counters", () => {
    expect(parseBackup('{"requests":[],"codes":[]}')).toEqual({
      requests: [],
      codes: [],
      sequences: {},
    });
  });

  it("refuses anything else", () => {
    expect(parseBackup("not json")).toBeNull();
    expect(parseBackup('{"requests":[]}')).toBeNull();
    expect(parseBackup("null")).toBeNull();
  });
});
