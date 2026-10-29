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

import type { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import {
  fetchCarrierTypes,
  fetchScopeOptions,
  fetchValuesInUse,
} from "./parameterProfileThunks";
import type { ParameterSearchState } from "./parameterSearchSlice";

/** Loading the scope lists, a parameter's carriers and its values in use. */
export const addProfileCases = (
  builder: ActionReducerMapBuilder<ParameterSearchState>,
): void => {
  builder
    .addCase(fetchScopeOptions.pending, (state) => {
      state.scopeStatus = "loading";
    })
    .addCase(fetchScopeOptions.fulfilled, (state, action) => {
      state.scopeOptions = action.payload;
      state.scopeStatus = "loaded";
    })
    .addCase(fetchScopeOptions.rejected, (state) => {
      state.scopeStatus = "failed";
    })
    .addCase(fetchCarrierTypes.pending, (state) => {
      state.carriersStatus = "loading";
    })
    .addCase(fetchCarrierTypes.fulfilled, (state, action) => {
      state.carriersByProperty[action.meta.arg.property] = action.payload;
      state.carriersStatus = "loaded";
    })
    .addCase(fetchCarrierTypes.rejected, (state, action) => {
      if (!action.meta.aborted) state.carriersStatus = "failed";
    })
    .addCase(fetchValuesInUse.pending, (state, action) => {
      state.valuesStatus = "loading";
      state.values = [];
      state.valuesProperty = action.meta.arg.property;
    })
    .addCase(fetchValuesInUse.fulfilled, (state, action) => {
      if (action.meta.arg.property !== state.valuesProperty) return;
      state.values = action.payload;
      state.valuesStatus = "loaded";
    })
    .addCase(fetchValuesInUse.rejected, (state, action) => {
      if (action.meta.aborted) return;
      if (action.meta.arg.property !== state.valuesProperty) return;
      state.valuesStatus = "failed";
    });
};
