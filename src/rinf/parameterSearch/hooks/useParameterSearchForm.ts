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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  criteriaFromSearchParams,
  criteriaKey,
  criteriaToSearchParams,
  isComplete,
  ParameterCriteria,
} from "../../models/parameterCriteria";

export interface ParameterSearchForm {
  /** What the form shows, edited freely until submitted. */
  draft: ParameterCriteria;
  update: (changes: Partial<ParameterCriteria>) => void;
  /** Puts the draft in the address, which runs the search. */
  submit: () => void;
  /** The search in the address: the one whose results are shown. */
  submitted: ParameterCriteria;
  canSubmit: boolean;
}

/**
 * The search lives in the page address (?parameter=…&condition=…), so it can
 * be shared as a link and the browser's Back button returns to it.
 */
export const useParameterSearchForm = (): ParameterSearchForm => {
  const [searchParams, setSearchParams] = useSearchParams();
  const submitted = useMemo(
    () => criteriaFromSearchParams(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<ParameterCriteria>(submitted);

  // Back/forward or a pasted link changes the address: show that search.
  const submittedKey = criteriaKey(submitted);
  useEffect(() => setDraft(submitted), [submittedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(
    (changes: Partial<ParameterCriteria>) =>
      setDraft((current) => ({ ...current, ...changes })),
    [],
  );

  const submit = useCallback(() => {
    if (isComplete(draft)) setSearchParams(criteriaToSearchParams(draft));
  }, [draft, setSearchParams]);

  return { draft, update, submit, submitted, canSubmit: isComplete(draft) };
};
