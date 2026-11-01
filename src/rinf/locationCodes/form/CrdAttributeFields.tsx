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

import { TextField } from "@mui/material";
import { useIntl } from "react-intl";
import { asciiName } from "../model/asciiName";
import { FREE_TEXT_MAX_LENGTH } from "../model/crdValues";
import { CRD_FLAGS, crdOf } from "../model/LocationCodeRequest";
import { CrdFlagField } from "./CrdFlagField";
import { FieldRow } from "./FieldRow";
import { FormSection, useFieldError } from "./FormSection";
import type { RequestForm } from "./hooks/useRequestForm";

interface CrdAttributeFieldsProps {
  form: RequestForm;
}

/**
 * CRD's other columns of a PLC: ASCII name, NUTS code, position, the four
 * flags and free text. Validity dates follow from the decision. For an
 * amendment every field is optional: what is left empty stays as it is.
 */
export const CrdAttributeFields = ({ form }: CrdAttributeFieldsProps) => {
  const { formatMessage } = useIntl();
  const { data, updateCrd, errors, fromRinf } = form;
  const fieldError = useFieldError(errors, fromRinf);
  const crd = crdOf(data);
  const amending = data.operation === "amendment";
  const generatedAscii = asciiName(data.locationName);
  return (
    <FormSection
      titleId="rinf_lc_form_crd"
      hintId={
        amending ? "rinf_lc_form_crd_hint_amendment" : "rinf_lc_form_crd_hint"
      }
    >
      <FieldRow>
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_crd_locationNameAscii" })}
          value={crd.locationNameAscii}
          placeholder={generatedAscii}
          onChange={(event) =>
            updateCrd({ locationNameAscii: event.target.value })
          }
          slotProps={{ inputLabel: { shrink: true } }}
          {...fieldError(
            "locationNameAscii",
            "rinf_lc_crd_locationNameAscii_hint",
          )}
        />
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_crd_nutsCode" })}
          value={crd.nutsCode}
          onChange={(event) =>
            updateCrd({ nutsCode: event.target.value.toUpperCase() })
          }
          {...fieldError("nutsCode", "rinf_lc_crd_nutsCode_hint")}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_crd_latitude" })}
          value={crd.latitude}
          onChange={(event) => updateCrd({ latitude: event.target.value })}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
          {...fieldError("latitude", "rinf_lc_crd_position_hint")}
        />
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_crd_longitude" })}
          value={crd.longitude}
          onChange={(event) => updateCrd({ longitude: event.target.value })}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
          {...fieldError("longitude", "rinf_lc_crd_position_hint")}
        />
      </FieldRow>
      <FieldRow>
        {CRD_FLAGS.map((flag) => (
          <CrdFlagField
            key={flag}
            form={form}
            flag={flag}
            amending={amending}
            value={crd[flag]}
          />
        ))}
      </FieldRow>
      <TextField
        size="small"
        multiline
        minRows={1}
        label={formatMessage({ id: "rinf_lc_crd_freeText" })}
        value={crd.freeText}
        onChange={(event) => updateCrd({ freeText: event.target.value })}
        slotProps={{ htmlInput: { maxLength: FREE_TEXT_MAX_LENGTH } }}
        {...fieldError("freeText", "rinf_lc_crd_freeText_hint")}
      />
    </FormSection>
  );
};
