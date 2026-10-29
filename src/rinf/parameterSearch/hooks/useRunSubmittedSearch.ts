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

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useRinfSparqlEndpoint } from "../../config/rinfEndpoint";
import {
  criteriaKey,
  isComplete,
  ParameterCriteria,
} from "../../models/parameterCriteria";
import { setSearchPath } from "../../state/parameterSearchSlice";
import { runParameterSearch } from "../../state/parameterSearchThunk";

/**
 * Runs the search in the address once the parameter's carriers and the
 * scope options are known — unless its results are already shown, e.g. on
 * returning from a details panel.
 */
export const useRunSubmittedSearch = (submitted: ParameterCriteria): void => {
  const dispatch = useAppDispatch();
  const endpoint = useRinfSparqlEndpoint();
  const { pathname, search } = useLocation();
  const { scopeOptions, carriersByProperty, resultsKey } = useAppSelector(
    (state) => state.rinf.parameterSearch,
  );
  const carriers = carriersByProperty[submitted.property];
  const key = criteriaKey(submitted);

  useEffect(() => {
    if (isComplete(submitted)) dispatch(setSearchPath(`${pathname}${search}`));
  }, [dispatch, pathname, search, submitted]);

  useEffect(() => {
    if (!isComplete(submitted) || !carriers || !scopeOptions) return;
    if (resultsKey === key) return;
    dispatch(
      runParameterSearch({
        endpoint,
        criteria: submitted,
        carriers,
        scopeOptions,
      }),
    );
    // key stands for submitted; resultsKey is checked, not watched.
  }, [dispatch, endpoint, key, carriers, scopeOptions]); // eslint-disable-line react-hooks/exhaustive-deps
};
