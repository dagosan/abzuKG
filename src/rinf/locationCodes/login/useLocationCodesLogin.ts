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

import { useContext } from "react";
import { useAuth } from "../../../auth/auth";
import { ConfigContext } from "../../../config/ConfigContext";
import { WORKFLOW_ROLES, WorkflowRole } from "../model/roles";

export interface LocationCodesLogin {
  /**
   * Location codes need a login: `locationCodesLoginRequired` and an
   * `oidcConfig` in bootstrap.json. Otherwise the role switcher is used, as
   * during development (Abzu's own login, if any, plays no part).
   */
  configured: boolean;
  /** The login state is still being restored (e.g. after a redirect). */
  loading: boolean;
  loggedIn: boolean;
  /** The account's name, from the login token. */
  name: string;
  /** The account's roles in the workflow, in the procedure's order. */
  roles: WorkflowRole[];
  login: () => void;
}

/** The login as the location code workflow sees it: who, and in which roles. */
export const useLocationCodesLogin = (): LocationCodesLogin => {
  const { oidcConfig, locationCodesLoginRequired } = useContext(ConfigContext);
  const auth = useAuth();
  const assigned = auth.roleAssignments ?? [];
  return {
    configured: Boolean(locationCodesLoginRequired && oidcConfig?.authority),
    loading: auth.isLoading,
    loggedIn: auth.isAuthenticated,
    name: auth.user?.name ?? "",
    roles: WORKFLOW_ROLES.filter((role) => assigned.includes(role)),
    login: () => {
      // Back to the same page after logging in.
      auth.login(window.location.href);
    },
  };
};
