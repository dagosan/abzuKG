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
Modified 2026-11-02: register as code versions with CRD's columns.
Modified 2026-11-09: latitude/longitude pre-filled from the URL ("Use this location").
Modified 2026-11-10: the form can be saved as a draft and a draft continued.
Modified 2026-11-14: Reset and Cancel. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  admissibilityErrors,
  AdmissibilityErrors,
} from "../../checks/admissibility";
import { isCountryPrefix } from "../../model/countries";
import {
  CrdAttributes,
  crdOf,
  RequestData,
  Requester,
  RinfLink,
} from "../../model/LocationCodeRequest";
import {
  DRAFT_PARAM,
  PREFILL_PARAMS,
  requestPath,
  RESUME_PARAM,
} from "../../page/locationCodesPath";
import { saveRequestDraft } from "../../state/draftThunks";
import {
  autofillStarted,
  clearFormDraft,
  setActor,
  setFormDraftId,
} from "../../state/locationCodesSlice";
import { submitLocationCodeRequest } from "../../state/locationCodesThunks";
import { newId } from "../../store/newId";
import { emptyRequestData } from "../../workflow/createRequest";
import { readRequester, writeRequester } from "../requesterPreference";
import {
  DiscardRequestForm,
  useDiscardRequestForm,
} from "./useDiscardRequestForm";
import { usePickOnMap } from "./usePickOnMap";
import { RinfAutofillState, useRinfAutofill } from "./useRinfAutofill";

export interface RequestForm
  extends
    Omit<RinfAutofillState, "forgetFromRinf" | "chooseRinfElement">,
    DiscardRequestForm {
  /** Sets the RINF element and fills the rest of the form from RINF. */
  chooseRinfElement: (link: RinfLink | null) => void;
  data: RequestData;
  update: (changes: Partial<RequestData>) => void;
  /** Changes CRD columns of the request (its `crd` part). */
  updateCrd: (changes: Partial<CrdAttributes>) => void;
  updateRequester: (changes: Partial<Requester>) => void;
  /** Errors to show: none until the first attempt to submit. */
  errors: AdmissibilityErrors;
  submitting: boolean;
  submit: () => void;
  /** Saves the form as it is, to continue later (no checks). */
  saveDraft: () => void;
  savingDraft: boolean;
  /** What the last save as draft came to: a text key and how to show it. */
  draftNotice: DraftNotice | null;
  /** Leaves for the map to pick the RINF element; the form waits. */
  pickOnMap: () => void;
}

export interface DraftNotice {
  severity: "success" | "warning" | "error";
  messageId: string;
}

const DRAFT_SAVED: DraftNotice = {
  severity: "success",
  messageId: "rinf_lc_draft_saved",
};
const DRAFT_NEEDS_NAME: DraftNotice = {
  severity: "warning",
  messageId: "rinf_lc_draft_needs_name",
};
const DRAFT_NOT_SAVED: DraftNotice = {
  severity: "error",
  messageId: "rinf_lc_draft_not_saved",
};

/** A coordinate from the URL, if it is a number in range. */
const coordinateParam = (
  params: URLSearchParams,
  key: string,
  limit: number,
): string => {
  const value = Number(params.get(key) ?? Number.NaN);
  return Number.isFinite(value) && Math.abs(value) <= limit
    ? String(value)
    : "";
};

const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

/** The form's first state: remembered requester, and what the URL pre-fills. */
export const initialRequestData = (
  params: URLSearchParams,
  actorName: string,
): RequestData => {
  const empty = emptyRequestData();
  const operationalPoint = params.get(PREFILL_PARAMS.operationalPoint);
  const country = params.get(PREFILL_PARAMS.country) ?? "";
  const name = params.get(PREFILL_PARAMS.name) ?? "";
  const latitude = coordinateParam(
    params,
    PREFILL_PARAMS.latitude,
    MAX_LATITUDE,
  );
  const longitude = coordinateParam(
    params,
    PREFILL_PARAMS.longitude,
    MAX_LONGITUDE,
  );
  return {
    ...empty,
    ...(latitude &&
      longitude && { crd: { ...empty.crd, latitude, longitude } }),
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
  const { actor, formDraft, formDraftId, pendingAutofill, savedDrafts } =
    useAppSelector((state) => state.rinf.locationCodes);
  const resumed = Boolean(params.get(RESUME_PARAM) && formDraft);
  // A saved draft to continue (?draft=…), as it was when the form opened.
  const [openedDraft] = useState(
    () =>
      savedDrafts.find((draft) => draft.id === params.get(DRAFT_PARAM)) ?? null,
  );
  // Back from the map: the form as it was, with the element picked there.
  const [data, setData] = useState<RequestData>(() => {
    if (resumed && formDraft) return formDraft;
    if (openedDraft) return { ...emptyRequestData(), ...openedDraft.data };
    return initialRequestData(params, actor.name);
  });
  useEffect(() => {
    // Back from the map the form keeps its draft; otherwise the one opened.
    if (!resumed) dispatch(setFormDraftId(openedDraft?.id ?? null));
    // Once, when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pickOnMap = usePickOnMap(data);
  const dataRef = useRef(data);
  dataRef.current = data;
  const autofill = useRinfAutofill(dataRef, setData);
  const { chooseRinfElement, forgetFromRinf } = autofill;

  // An element picked on the map, or given by an OP's panel: fill from RINF.
  useEffect(() => {
    const link = dataRef.current.rinfLink;
    // A draft keeps what its owner typed: RINF does not fill it in again.
    const keepsItsValues = (resumed && !pendingAutofill) || openedDraft;
    if (!link || keepsItsValues) return;
    dispatch(autofillStarted());
    chooseRinfElement(link);
    // Once, when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftNotice, setDraftNotice] = useState<DraftNotice | null>(null);
  const allErrors = useMemo(() => admissibilityErrors(data), [data]);

  const update = useCallback(
    (changes: Partial<RequestData>) => {
      setData((current) => ({ ...current, ...changes }));
      forgetFromRinf(Object.keys(changes));
    },
    [forgetFromRinf],
  );
  const updateCrd = useCallback(
    (changes: Partial<CrdAttributes>) => {
      setData((current) => ({
        ...current,
        crd: { ...crdOf(current), ...changes },
      }));
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
    dispatch(
      submitLocationCodeRequest({
        data,
        actor: submitter,
        ...(formDraftId && { draftId: formDraftId }),
      }),
    )
      .unwrap()
      .then((request) => {
        dispatch(clearFormDraft());
        navigate(requestPath(request.id));
      })
      .finally(() => setSubmitting(false));
  }, [allErrors, submitting, data, actor, formDraftId, dispatch, navigate]);

  const saveDraft = useCallback(() => {
    // A draft belongs to whoever acts now; without a name yet, the form's.
    const owner = actor.name || data.requester.name.trim();
    if (!owner) {
      setDraftNotice(DRAFT_NEEDS_NAME);
      return;
    }
    if (savingDraft) return;
    if (!actor.name) dispatch(setActor({ ...actor, name: owner }));
    setSavingDraft(true);
    writeRequester(data.requester);
    dispatch(saveRequestDraft({ id: formDraftId ?? newId(), data, owner }))
      .unwrap()
      .then((draft) => {
        dispatch(setFormDraftId(draft.id));
        setDraftNotice(DRAFT_SAVED);
      })
      .catch(() => setDraftNotice(DRAFT_NOT_SAVED))
      .finally(() => setSavingDraft(false));
  }, [actor, data, formDraftId, savingDraft, dispatch]);

  const blank = useCallback(
    () => initialRequestData(new URLSearchParams(), actor.name),
    [actor.name],
  );
  const forgetAttempt = useCallback(() => setAttempted(false), []);
  const discard = useDiscardRequestForm({
    data,
    setData,
    blank,
    chooseRinfElement,
    forgetAttempt,
  });

  return {
    ...discard,
    data,
    update,
    updateCrd,
    updateRequester,
    errors: attempted ? allErrors : {},
    submitting,
    submit,
    saveDraft,
    savingDraft,
    draftNotice,
    pickOnMap,
    chooseRinfElement,
    fromRinf: autofill.fromRinf,
    notice: autofill.notice,
    loading: autofill.loading,
    applyRinfChoice: autofill.applyRinfChoice,
  };
};
