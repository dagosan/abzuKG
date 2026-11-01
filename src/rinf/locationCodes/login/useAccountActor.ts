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

Added for the ERA RINF frontend, 2026-11-01. */

import { useEffect } from "react";
import { useAuth } from "../../../auth/auth";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setActor } from "../state/locationCodesSlice";
import { setAccessTokenSource } from "./accessToken";
import { useLocationCodesLogin } from "./useLocationCodesLogin";

/**
 * With a login set up, the person acting is the logged-in account: its name,
 * and one of its roles (the last one chosen if the account still holds it).
 * The stores send the account's token with every call.
 */
export const useAccountActor = (): void => {
  const dispatch = useAppDispatch();
  const auth = useAuth();
  const { configured, loggedIn, name, roles } = useLocationCodesLogin();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const roleKey = roles.join(",");

  useEffect(() => {
    setAccessTokenSource(configured && loggedIn ? auth.getAccessToken : null);
  }, [auth.getAccessToken, configured, loggedIn]);

  useEffect(() => {
    if (!configured || !loggedIn || roles.length === 0) return;
    const role = roles.includes(actor.role) ? actor.role : roles[0];
    if (actor.name !== name || actor.role !== role) {
      dispatch(setActor({ name, role }));
    }
    // roleKey stands for roles.
  }, [actor.name, actor.role, configured, dispatch, loggedIn, name, roleKey]); // eslint-disable-line react-hooks/exhaustive-deps
};
