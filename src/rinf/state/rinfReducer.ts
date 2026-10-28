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

Added for the ERA RINF frontend, 2026-10-28. */

import { combineReducers } from "@reduxjs/toolkit";
import { operationalPointsReducer } from "./operationalPointsSlice";
import { parameterDictionaryReducer } from "./parameterDictionarySlice";
import { sectionOfLineDetailsReducer } from "./sectionOfLineDetailsSlice";
import { sectionsOfLineReducer } from "./sectionsOfLineSlice";

/** All RINF state, registered once in the root reducer as `rinf`. */
export const rinfReducer = combineReducers({
  operationalPoints: operationalPointsReducer,
  sectionsOfLine: sectionsOfLineReducer,
  sectionOfLineDetails: sectionOfLineDetailsReducer,
  parameterDictionary: parameterDictionaryReducer,
});
