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
Modified 2026-10-30: the store submits and takes steps instead of saving documents. */

import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";
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
const code = { key: "SE00001" } as unknown as RegisteredCode;
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
