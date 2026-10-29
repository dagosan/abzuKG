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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  admissibilityErrors,
  AdmissibilityErrors,
} from "../../checks/admissibility";
import { isCountryPrefix } from "../../model/countries";
import type {
  RequestData,
  Requester,
  RinfLink,
} from "../../model/LocationCodeRequest";
import {
  PREFILL_PARAMS,
  requestPath,
  RESUME_PARAM,
} from "../../page/locationCodesPath";
import {
  autofillStarted,
  clearFormDraft,
  setActor,
} from "../../state/locationCodesSlice";
import { submitLocationCodeRequest } from "../../state/locationCodesThunks";
import { emptyRequestData } from "../../workflow/createRequest";
import { readRequester, writeRequester } from "../requesterPreference";
import { usePickOnMap } from "./usePickOnMap";
import { RinfAutofillState, useRinfAutofill } from "./useRinfAutofill";

export interface RequestForm extends Omit<
  RinfAutofillState,
  "forgetFromRinf" | "chooseRinfElement"
> {
  /** Sets the RINF element and fills the rest of the form from RINF. */
  chooseRinfElement: (link: RinfLink | null) => void;
  data: RequestData;
  update: (changes: Partial<RequestData>) => void;
  updateRequester: (changes: Partial<Requester>) => void;
  /** Errors to show: none until the first attempt to submit. */
  errors: AdmissibilityErrors;
  submitting: boolean;
  submit: () => void;
  /** Leaves for the map to pick the RINF element; the form waits. */
  pickOnMap: () => void;
}

/** The form's first state: remembered requester, and what the URL pre-fills. */
const initialData = (
  params: URLSearchParams,
  actorName: string,
): RequestData => {
  const empty = emptyRequestData();
  const operationalPoint = params.get(PREFILL_PARAMS.operationalPoint);
  const country = params.get(PREFILL_PARAMS.country) ?? "";
  const name = params.get(PREFILL_PARAMS.name) ?? "";
  return {
    ...empty,
    country: isCountryPrefix(country) ? country : "",
    locationName: name,
    rinfLink: operationalPoint
      ? {
          kind: "operationalPoint",
          canonicalId: operationalPoint,
          label: name || operationalPoint,
        }
      : null,
    requester: {
      ...empty.requester,
      ...readRequester(),
      ...(actorName && { name: actorName }),
    },
  };
};

/** State, validation and submission of the new request form (steps 1–2). */
export const useRequestForm = (): RequestForm => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { actor, formDraft, pendingAutofill } = useAppSelector(
    (state) => state.rinf.locationCodes,
  );
  const resumed = Boolean(params.get(RESUME_PARAM) && formDraft);
  // Back from the map: the form as it was, with the element picked there.
  const [data, setData] = useState<RequestData>(() =>
    resumed && formDraft ? formDraft : initialData(params, actor.name),
  );
  const pickOnMap = usePickOnMap(data);
  const dataRef = useRef(data);
  dataRef.current = data;
  const autofill = useRinfAutofill(dataRef, setData);
  const { chooseRinfElement, forgetFromRinf } = autofill;

  // An element picked on the map, or given by an OP's panel: fill from RINF.
  useEffect(() => {
    const link = dataRef.current.rinfLink;
    if (!link || (resumed && !pendingAutofill)) return;
    dispatch(autofillStarted());
    chooseRinfElement(link);
    // Once, when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const allErrors = useMemo(() => admissibilityErrors(data), [data]);

  const update = useCallback(
    (changes: Partial<RequestData>) => {
      setData((current) => ({ ...current, ...changes }));
      forgetFromRinf(Object.keys(changes));
    },
    [forgetFromRinf],
  );
  const updateRequester = useCallback(
    (changes: Partial<Requester>) =>
      setData((current) => ({
        ...current,
        requester: { ...current.requester, ...changes },
      })),
    [],
  );

  const submit = useCallback(() => {
    setAttempted(true);
    if (Object.keys(allErrors).length > 0 || submitting) return;
    setSubmitting(true);
    writeRequester(data.requester);
    // The submitter is whoever acts now; without a name yet, the form's.
    const submitter = {
      ...actor,
      name: actor.name || data.requester.name.trim(),
    };
    if (!actor.name) dispatch(setActor(submitter));
    dispatch(submitLocationCodeRequest({ data, actor: submitter }))
      .unwrap()
      .then((request) => {
        dispatch(clearFormDraft());
        navigate(requestPath(request.id));
      })
      .finally(() => setSubmitting(false));
  }, [allErrors, submitting, data, actor, dispatch, navigate]);

  return {
    data,
    update,
    updateRequester,
    errors: attempted ? allErrors : {},
    submitting,
    submit,
    pickOnMap,
    chooseRinfElement,
    fromRinf: autofill.fromRinf,
    notice: autofill.notice,
    loading: autofill.loading,
    applyRinfChoice: autofill.applyRinfChoice,
  };
};
