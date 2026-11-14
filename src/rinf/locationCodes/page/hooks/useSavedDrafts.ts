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

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { useLocationCodesLogin } from "../../login/useLocationCodesLogin";
import type { RequestDraft } from "../../model/RequestDraft";
import { loadDrafts } from "../../state/draftThunks";

/**
 * A requester's saved drafts, loaded once it is known whose they are: the
 * actor's name, and with a login set up, once logged in. Empty for Agency
 * roles, who do not request codes.
 */
export const useSavedDrafts = (): RequestDraft[] => {
  const dispatch = useAppDispatch();
  const { name, role } = useAppSelector(
    (state) => state.rinf.locationCodes.actor,
  );
  const drafts = useAppSelector(
    (state) => state.rinf.locationCodes.savedDrafts,
  );
  const login = useLocationCodesLogin();
  const isRequester = role === "requester";
  const mayLoad =
    isRequester && name.trim() !== "" && (!login.configured || login.loggedIn);

  useEffect(() => {
    if (mayLoad) dispatch(loadDrafts(name));
  }, [dispatch, mayLoad, name]);

  return isRequester ? drafts : [];
};
