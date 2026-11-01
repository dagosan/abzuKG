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

/**
 * Where the stores get the logged-in user's access token. The stores are
 * not React code, so the login hook hands them a way to read it; with no
 * login (or none configured) there is no token and nothing is sent.
 */
type AccessTokenSource = () => Promise<string>;

let source: AccessTokenSource | null = null;

export const setAccessTokenSource = (next: AccessTokenSource | null): void => {
  source = next;
};

/** The current access token, or null when nobody is logged in. */
export const currentAccessToken = async (): Promise<string | null> => {
  if (!source) return null;
  try {
    return await source();
  } catch {
    return null;
  }
};
