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

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import type { RinfLink } from "../model/LocationCodeRequest";
import { resumeRequestPath } from "../page/locationCodesPath";
import {
  cancelPicking,
  MapPicking,
  pickRinfElement,
} from "../state/locationCodesSlice";

export interface PickTarget {
  /** Null unless the user is picking an element for the request form. */
  picking: MapPicking | null;
  /** Hands the element to the form and goes back to it. */
  choose: (link: RinfLink) => void;
  /** Back to the form without choosing. */
  cancel: () => void;
}

/** The map side of "Pick on map": what may be picked, and the way back. */
export const usePickTarget = (): PickTarget => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const picking = useAppSelector((state) => state.rinf.locationCodes.picking);
  const choose = useCallback(
    (link: RinfLink) => {
      dispatch(pickRinfElement(link));
      navigate(resumeRequestPath);
    },
    [dispatch, navigate],
  );
  const cancel = useCallback(() => {
    dispatch(cancelPicking());
    navigate(resumeRequestPath);
  }, [dispatch, navigate]);
  return { picking, choose, cancel };
};
