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

import type { RequestData } from "./LocationCodeRequest";

/**
 * A request form saved before it is submitted (LCMS specification: state
 * "Draft"). Not a request: it has no status or history, only its owner
 * sees it, and it goes when it is submitted or discarded.
 */
export interface RequestDraft {
  id: string;
  /** The requester it belongs to, by name. */
  owner: string;
  /** ISO instant of the last save. */
  savedAt: string;
  data: RequestData;
}

/** `drafts` with `draft` added, or put in place of the one with its id; last saved first. */
export const withDraft = (
  drafts: RequestDraft[],
  draft: RequestDraft,
): RequestDraft[] => [draft, ...withoutDraft(drafts, draft.id)];

export const withoutDraft = (
  drafts: RequestDraft[],
  draftId: string,
): RequestDraft[] => drafts.filter((other) => other.id !== draftId);
