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

Added for the ERA RINF frontend, 2026-11-02. */

import { MenuItem, TextField } from "@mui/material";
import { useIntl } from "react-intl";
import type { CrdFlag } from "../model/LocationCodeRequest";
import type { RequestForm } from "./hooks/useRequestForm";
import { useFieldError } from "./FormSection";

const YES = "yes";
const NO = "no";
const NOT_GIVEN = "";

const choiceOf = (value: boolean | null): string =>
  value === null ? NOT_GIVEN : value ? YES : NO;

const valueOf = (choice: string): boolean | null =>
  choice === NOT_GIVEN ? null : choice === YES;

interface CrdFlagFieldProps {
  form: RequestForm;
  flag: CrdFlag;
  /** Amendment: the empty choice means "unchanged". */
  amending: boolean;
  value: boolean | null;
}

/** Yes or no for one of CRD's four flags. */
export const CrdFlagField = ({
  form,
  flag,
  amending,
  value,
}: CrdFlagFieldProps) => {
  const { formatMessage } = useIntl();
  const fieldError = useFieldError(form.errors, form.fromRinf);
  return (
    <TextField
      select
      size="small"
      label={formatMessage({ id: `rinf_lc_crd_${flag}` })}
      value={choiceOf(value)}
      onChange={(event) =>
        form.updateCrd({ [flag]: valueOf(event.target.value) })
      }
      {...fieldError(flag)}
    >
      {amending && (
        <MenuItem value={NOT_GIVEN}>
          {formatMessage({ id: "rinf_lc_crd_unchanged" })}
        </MenuItem>
      )}
      <MenuItem value={YES}>
        {formatMessage({ id: "rinf_lc_crd_yes" })}
      </MenuItem>
      <MenuItem value={NO}>{formatMessage({ id: "rinf_lc_crd_no" })}</MenuItem>
    </TextField>
  );
};
