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
import { push } from "redux-first-history";
import { useConfirmLeave } from "../../../../components/modern/Shared/UnsavedChangesGuard";
import { useAppDispatch } from "../../../../store/hooks";
import { LOCATION_CODES_PATH } from "../locationCodesPath";

/** Opens the location code requests; the header sits outside the router. */
export const useGoToLocationCodes = (): (() => void) => {
  const dispatch = useAppDispatch();
  const confirmLeave = useConfirmLeave();
  return useCallback(
    () => confirmLeave(() => dispatch(push(LOCATION_CODES_PATH))),
    [confirmLeave, dispatch],
  );
};
