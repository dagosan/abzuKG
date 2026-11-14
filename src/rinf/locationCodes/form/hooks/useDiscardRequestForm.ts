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

Added for the ERA RINF frontend, 2026-11-14. */

import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../../store/hooks";
import type { RequestData, RinfLink } from "../../model/LocationCodeRequest";
import { myRequestsPath, newRequestPath } from "../../page/locationCodesPath";
import { clearFormDraft } from "../../state/locationCodesSlice";

export interface DiscardRequestForm {
  /** The form holds something an empty form does not. */
  changed: boolean;
  /** Empties the form and stays on it. */
  reset: () => void;
  /** Leaves the form for the requester's list; nothing is submitted. */
  cancel: () => void;
}

interface DiscardRequestFormOptions {
  data: RequestData;
  setData: Dispatch<SetStateAction<RequestData>>;
  /** The empty form: nothing from the URL, the remembered requester. */
  blank: () => RequestData;
  chooseRinfElement: (link: RinfLink | null) => void;
  /** Hides the errors of an earlier attempt to submit. */
  forgetAttempt: () => void;
}

/** Reset and Cancel of the new request form. */
export const useDiscardRequestForm = ({
  data,
  setData,
  blank,
  chooseRinfElement,
  forgetAttempt,
}: DiscardRequestFormOptions): DiscardRequestForm => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const changed = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(blank()),
    [data, blank],
  );

  const reset = useCallback(() => {
    // Also stops a RINF lookup under way and drops its notice.
    chooseRinfElement(null);
    setData(blank());
    forgetAttempt();
    dispatch(clearFormDraft());
    // Without the parameters that pre-filled the form.
    navigate(newRequestPath(), { replace: true });
  }, [chooseRinfElement, setData, blank, forgetAttempt, dispatch, navigate]);

  const cancel = useCallback(() => {
    dispatch(clearFormDraft());
    navigate(myRequestsPath);
  }, [dispatch, navigate]);

  return { changed, reset, cancel };
};
