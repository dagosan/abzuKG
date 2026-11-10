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
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import type { MasterData } from "../model/masterData";
import { loadMasterData } from "./masterDataThunks";

/**
 * The countries and subsidiary types, loaded from the store the first time
 * a component asks; the built-in lists until then, and if the load fails.
 */
export const useMasterData = (): MasterData => {
  const dispatch = useAppDispatch();
  const masterData = useAppSelector(
    (state) => state.rinf.locationCodes.masterData,
  );
  const isIdle = useAppSelector(
    (state) => state.rinf.locationCodes.masterDataLoadStatus === "idle",
  );

  useEffect(() => {
    if (isIdle) dispatch(loadMasterData());
  }, [dispatch, isIdle]);

  return masterData;
};
