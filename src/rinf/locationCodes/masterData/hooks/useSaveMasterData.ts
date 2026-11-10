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

import { useCallback, useState } from "react";
import { useAppDispatch } from "../../../../store/hooks";
import type { Country, SubsidiaryType } from "../../model/masterData";
import { saveCountry, saveSubsidiaryType } from "../../state/masterDataThunks";

const SAVE_FAILED = "rinf_lc_md_error_save_failed";

export interface SaveMasterData {
  busy: boolean;
  /** Text key or message of the last refused save. */
  error: string | null;
  /** True when saved. */
  saveCountry: (country: Country) => Promise<boolean>;
  saveSubsidiaryType: (type: SubsidiaryType) => Promise<boolean>;
}

/** Saves one master data entry and reports why the store refused it. */
export const useSaveMasterData = (): SaveMasterData => {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (save: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await save();
      return true;
    } catch (failure) {
      setError((failure as { message?: string }).message ?? SAVE_FAILED);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    busy,
    error,
    saveCountry: useCallback(
      (country) => run(() => dispatch(saveCountry(country)).unwrap()),
      [dispatch, run],
    ),
    saveSubsidiaryType: useCallback(
      (type) => run(() => dispatch(saveSubsidiaryType(type)).unwrap()),
      [dispatch, run],
    ),
  };
};
