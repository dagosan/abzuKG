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

import { useCallback, useRef, useState } from "react";
import { push } from "redux-first-history";
import { useConfirmLeave } from "../../../components/modern/Shared/UnsavedChangesGuard";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { MIN_SEARCH_LENGTH } from "../../api/operationalPointSearchQuery";
import { useRinfSparqlEndpoint } from "../../config/rinfEndpoint";
import { detailsPath } from "../../detailsKinds";
import type { OperationalPointSearchResult } from "../../models/OperationalPointSearchResult";
import type { RinfLoadStatus } from "../../state/loadStatus";
import { clearSearch, searchOperationalPoints } from "../../state/searchSlice";

export interface OperationalPointSearch {
  text: string;
  setText: (text: string) => void;
  /** Runs the search for the current text; too-short text does nothing. */
  submit: () => void;
  open: (result: OperationalPointSearchResult) => void;
  status: RinfLoadStatus;
  results: OperationalPointSearchResult[];
  /** True when the text differs from what the shown results are for. */
  isStale: boolean;
  isTooShort: boolean;
}

/**
 * State and actions of the RINF search box. Searching takes 2–3 s, so it
 * runs on Enter rather than on every keystroke.
 */
export const useOperationalPointSearch = (): OperationalPointSearch => {
  const dispatch = useAppDispatch();
  const confirmLeave = useConfirmLeave();
  const endpoint = useRinfSparqlEndpoint();
  const { status, results, searchedText } = useAppSelector(
    (state) => state.rinf.search,
  );
  const [text, setTextState] = useState(searchedText);
  const pendingRef = useRef<{ abort: () => void } | null>(null);
  const trimmed = text.trim();

  const setText = useCallback(
    (next: string) => {
      setTextState(next);
      if (!next.trim()) {
        pendingRef.current?.abort();
        dispatch(clearSearch());
      }
    },
    [dispatch],
  );

  const submit = useCallback(() => {
    if (trimmed.length < MIN_SEARCH_LENGTH) return;
    pendingRef.current?.abort();
    pendingRef.current = dispatch(
      searchOperationalPoints({ endpoint, text: trimmed }),
    );
  }, [dispatch, endpoint, trimmed]);

  // The header sits outside the router, so it navigates through the store,
  // as Abzu's own header does.
  const open = useCallback(
    ({ canonicalId }: OperationalPointSearchResult) =>
      confirmLeave(() =>
        dispatch(push(detailsPath("operationalPoint", canonicalId))),
      ),
    [confirmLeave, dispatch],
  );

  return {
    text,
    setText,
    submit,
    open,
    status,
    results,
    isStale: trimmed !== searchedText,
    isTooShort: trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH,
  };
};
