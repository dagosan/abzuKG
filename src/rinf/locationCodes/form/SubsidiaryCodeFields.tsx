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

import { MenuItem, TextField } from "@mui/material";
import { useIntl } from "react-intl";
import { isCreation } from "../model/codeTypes";
import { SUBSIDIARY_TYPES } from "../model/subsidiaryTypes";
import { FieldRow } from "./FieldRow";
import { useFieldError } from "./FormSection";
import type { RequestForm } from "./hooks/useRequestForm";

interface SubsidiaryCodeFieldsProps {
  form: RequestForm;
}

/** An SLC: its parent PLC, type, value and name (or the code to change). */
export const SubsidiaryCodeFields = ({ form }: SubsidiaryCodeFieldsProps) => {
  const { formatMessage } = useIntl();
  const { data, update, errors } = form;
  const fieldError = useFieldError(errors, form.fromRinf);
  const creating = isCreation(data.operation);

  const parentField = (
    <TextField
      size="small"
      label={formatMessage({ id: "rinf_lc_field_parent" })}
      value={data.parentPrimaryCode}
      onChange={(event) =>
        update({ parentPrimaryCode: event.target.value.toUpperCase() })
      }
      {...fieldError("parentPrimaryCode", "rinf_lc_field_parent_hint")}
    />
  );
  const typeField = (
    <TextField
      select
      size="small"
      label={formatMessage({ id: "rinf_lc_field_type" })}
      value={data.subsidiaryTypeCode}
      onChange={(event) => update({ subsidiaryTypeCode: event.target.value })}
      {...fieldError("subsidiaryTypeCode", "rinf_lc_field_type_hint")}
    >
      {SUBSIDIARY_TYPES.map((type) => (
        <MenuItem key={type.code} value={type.code}>
          {type.code} · {type.name}
        </MenuItem>
      ))}
    </TextField>
  );
  const codeField = (
    <TextField
      size="small"
      label={formatMessage({
        id: creating
          ? data.operation === "existingCode"
            ? "rinf_lc_field_existing_code"
            : "rinf_lc_field_proposed_code"
          : "rinf_lc_field_target_subsidiary",
      })}
      value={creating ? data.proposedCode : data.targetCode}
      onChange={(event) =>
        update(
          creating
            ? { proposedCode: event.target.value }
            : { targetCode: event.target.value },
        )
      }
      {...fieldError(
        creating ? "proposedCode" : "targetCode",
        "rinf_lc_field_subsidiary_code_hint",
      )}
    />
  );
  const nameField = data.operation !== "deactivation" && (
    <TextField
      size="small"
      label={formatMessage({
        id: creating ? "rinf_lc_field_name" : "rinf_lc_field_name_optional",
      })}
      value={data.locationName}
      onChange={(event) => update({ locationName: event.target.value })}
      {...fieldError("locationName", "rinf_lc_field_name_hint")}
    />
  );

  // Creating: parent and type, then code and name. Changing: parent and code.
  if (creating)
    return (
      <>
        <FieldRow>
          {parentField}
          {typeField}
        </FieldRow>
        <FieldRow>
          {codeField}
          {nameField}
        </FieldRow>
      </>
    );
  return (
    <>
      <FieldRow>
        {parentField}
        {codeField}
      </FieldRow>
      {nameField && <FieldRow>{nameField}</FieldRow>}
    </>
  );
};
