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

import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";
import { parseBackup } from "./backupFile";
import {
  createTiamatStore,
  KG_UNAVAILABLE_ERROR,
  STALE_ERROR,
  UNREACHABLE_ERROR,
} from "./tiamatStore";

const BASE = "https://tiamat.test/era/v1/location-codes/";
const request = { id: "r 1", events: [] } as unknown as LocationCodeRequest;
const code = { key: "SE00001" } as unknown as RegisteredCode;

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

  it("saves a request under its encoded id", async () => {
    const fetchMock = mockFetch(answer(204));
    await createTiamatStore(BASE).saveRequest(request);
    expect(sent(fetchMock)).toEqual({
      url: "https://tiamat.test/era/v1/location-codes/requests/r%201",
      method: "PUT",
      body: JSON.stringify(request),
    });
  });

  it("publishes the request and its codes in one call", async () => {
    const fetchMock = mockFetch(answer(204));
    await createTiamatStore(BASE).saveRequestWithCodes(request, [code]);
    expect(sent(fetchMock)).toMatchObject({
      url: `${BASE}requests/r%201/with-codes`,
      method: "PUT",
      body: JSON.stringify({ request, codes: [code] }),
    });
  });

  it("reads the next reference number", async () => {
    mockFetch(answer(200, { year: 2026, value: 7 }));
    await expect(
      createTiamatStore(BASE).nextReferenceSequence(2026),
    ).resolves.toBe(7);
  });

  it("asks to reload when someone else saved first", async () => {
    mockFetch(answer(409, { error: "staleCode", message: "x", details: [] }));
    await expect(createTiamatStore(BASE).saveCodes([code])).rejects.toThrow(
      STALE_ERROR,
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
    await expect(createTiamatStore(BASE).saveCodes([code])).rejects.toThrow(
      "BE00438: already in the KG; SE77777/1: no parent",
    );
  });

  it("says when the Knowledge Graph or Tiamat cannot answer", async () => {
    mockFetch(answer(503, { error: "knowledgeGraphUnavailable" }));
    await expect(createTiamatStore(BASE).saveCodes([code])).rejects.toThrow(
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
