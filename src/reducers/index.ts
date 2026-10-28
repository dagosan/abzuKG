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
limitations under the Licence. */

/* Modified for the ERA RINF frontend, 2026-10-28: added the rinf reducer. */

import { combineReducers } from "@reduxjs/toolkit";

import type { Reducer } from "redux";
import groupOfStopPlaceReducer from "./groupOfStopPlacesReducer";
import loadingReducer from "./loadingReducer";
import mapReducer from "./mapReducer";
import reportReducer from "./reportReducer";
import snackbarReducer from "./snackbarReducer";
import stopPlaceReducer from "./stopPlaceReducer";
import userReducer from "./userReducer";
import zonesSlice from "./zonesSlice";
import rinfSlice from "../rinf/state/rinfSlice";

export const createRootReducer = (routerReducer: Reducer) =>
  combineReducers({
    router: routerReducer,
    user: userReducer,
    mapUtils: mapReducer,
    stopPlace: stopPlaceReducer,
    report: reportReducer,
    snackbar: snackbarReducer,
    stopPlacesGroup: groupOfStopPlaceReducer,
    loading: loadingReducer,
    zones: zonesSlice,
    rinf: rinfSlice,
  });
