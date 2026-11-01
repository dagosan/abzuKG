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

Added for the ERA RINF frontend, 2026-11-01. */

import { afterEach, describe, expect, it, vi } from "vitest";
import { setAccessTokenSource } from "../login/accessToken";
import { LOGIN_REQUIRED_ERROR, ROLE_NOT_HELD_ERROR } from "./storeErrors";
import { createTiamatStore } from "./tiamatStore";

const BASE = "https://tiamat.test/era/v1/location-codes";

const respondWith = (status: number, body: unknown = []) => {
  const fetchMock = vi.fn(
    async () => new Response(JSON.stringify(body), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const headersOf = (fetchMock: ReturnType<typeof respondWith>) => {
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return init.headers as Record<string, string>;
};

describe("tiamatStore with a login", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessTokenSource(null);
  });

  it("sends the logged-in user's token", async () => {
    setAccessTokenSource(async () => "token-1");
    const fetchMock = respondWith(200);
    await createTiamatStore(BASE).loadRequests();
    expect(headersOf(fetchMock).Authorization).toBe("Bearer token-1");
  });

  it("sends no token when nobody is logged in, or the token can't be read", async () => {
    let fetchMock = respondWith(200);
    await createTiamatStore(BASE).loadCodes();
    expect(headersOf(fetchMock).Authorization).toBeUndefined();

    setAccessTokenSource(() => Promise.reject(new Error("expired")));
    fetchMock = respondWith(200);
    await createTiamatStore(BASE).loadCodes();
    expect(headersOf(fetchMock).Authorization).toBeUndefined();
  });

  it("turns Tiamat's login and role refusals into messages", async () => {
    respondWith(401, { error: "loginRequired" });
    await expect(createTiamatStore(BASE).loadRequests()).rejects.toThrow(
      LOGIN_REQUIRED_ERROR,
    );
    respondWith(403, { error: "roleNotHeld" });
    await expect(createTiamatStore(BASE).exportSnapshot()).rejects.toThrow(
      ROLE_NOT_HELD_ERROR,
    );
  });
});
