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

Added for the ERA Location Code Manager, 2026-11-10. */

import type { RequestData } from "../model/LocationCodeRequest";
import { RequestDraft, withDraft, withoutDraft } from "../model/RequestDraft";
import { isSamePerson } from "../model/roles";

const STORAGE_KEY = "abzuKG.locationCodes.drafts.v1";

/** Kept in memory when browser storage is missing, full or blocked. */
let memoryCopy: RequestDraft[] | null = null;

const readAll = (): RequestDraft[] => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as RequestDraft[];
  } catch {
    // Fall back to the in-memory copy below.
  }
  return memoryCopy ?? [];
};

const writeAll = (drafts: RequestDraft[]): void => {
  memoryCopy = drafts;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Kept in memory only.
  }
};

/** This browser's drafts of `owner`, last saved first. */
export const readDrafts = (owner: string): RequestDraft[] =>
  readAll().filter((draft) => isSamePerson(draft.owner, owner));

export const saveDraftInBrowser = (
  id: string,
  data: RequestData,
  owner: string,
): RequestDraft => {
  const draft = { id, owner, savedAt: new Date().toISOString(), data };
  writeAll(withDraft(readAll(), draft));
  return draft;
};

/** Removes the draft if it is `owner`'s; another person's stays. */
export const deleteDraftInBrowser = (id: string, owner: string): void =>
  writeAll(
    readAll().filter(
      (draft) => draft.id !== id || !isSamePerson(draft.owner, owner),
    ),
  );
