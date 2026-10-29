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

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useRinfSparqlEndpoint } from "../../config/rinfEndpoint";
import type { CarrierType } from "../../models/parameterAttachments";
import type { ParameterCriteria } from "../../models/parameterCriteria";
import {
  inferValueKind,
  ValueInUse,
  ValueKind,
} from "../../models/parameterValues";
import { datasetsToSearch, ScopeOptions } from "../../models/scopeOptions";
import type { RinfLoadStatus } from "../../state/loadStatus";
import { fetchParameterDictionary } from "../../state/parameterDictionarySlice";
import {
  fetchCarrierTypes,
  fetchScopeOptions,
  fetchValuesInUse,
} from "../../state/parameterProfileThunks";

export interface ParameterProfile {
  scopeOptions: ScopeOptions | null;
  /** Undefined until loaded for the chosen parameter. */
  carriers: CarrierType[] | undefined;
  carriersStatus: RinfLoadStatus;
  /** The chosen parameter's values in use; empty until they are known. */
  values: ValueInUse[];
  /** True once the values (and so the kind of value) of the chosen parameter are known. */
  valuesKnown: boolean;
  valueKind: ValueKind;
}

/**
 * Everything the form needs about the chosen parameter: which elements carry
 * it, and the values in use within the chosen countries and IMs.
 */
export const useParameterProfile = (
  draft: ParameterCriteria,
): ParameterProfile => {
  const dispatch = useAppDispatch();
  const endpoint = useRinfSparqlEndpoint();
  const { property, countries, infrastructureManagers } = draft;
  const state = useAppSelector((root) => root.rinf.parameterSearch);
  const { scopeOptions, scopeStatus, carriersByProperty, values } = state;
  const carriers = property ? carriersByProperty[property] : undefined;

  useEffect(() => {
    dispatch(fetchParameterDictionary(endpoint));
    if (scopeStatus === "idle") dispatch(fetchScopeOptions(endpoint));
  }, [dispatch, endpoint, scopeStatus]);

  useEffect(() => {
    if (!property || carriers) return;
    const request = dispatch(fetchCarrierTypes({ endpoint, property }));
    return () => request.abort();
  }, [dispatch, endpoint, property, carriers]);

  const datasets = useMemo(
    () =>
      scopeOptions
        ? datasetsToSearch(scopeOptions, countries, infrastructureManagers)
        : null,
    [scopeOptions, countries, infrastructureManagers],
  );
  const datasetsKey = datasets?.join(",") ?? "all";

  useEffect(() => {
    if (!property || !scopeOptions) return;
    const request = dispatch(
      fetchValuesInUse({ endpoint, property, datasets }),
    );
    return () => request.abort();
    // datasetsKey stands for datasets, which is a new array on each render.
  }, [dispatch, endpoint, property, scopeOptions, datasetsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const valuesKnown =
    state.valuesStatus === "loaded" && state.valuesProperty === property;
  const knownValues = valuesKnown ? values : [];

  return {
    scopeOptions,
    carriers,
    carriersStatus: carriers ? "loaded" : state.carriersStatus,
    values: knownValues,
    valuesKnown,
    valueKind: inferValueKind(knownValues),
  };
};
