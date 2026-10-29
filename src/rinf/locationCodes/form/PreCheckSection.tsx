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

import { Box, Checkbox, FormControlLabel, FormHelperText } from "@mui/material";
import { useIntl } from "react-intl";
import { FormSection } from "./FormSection";
import type { RequestForm } from "./hooks/useRequestForm";

interface PreCheckSectionProps {
  form: RequestForm;
}

/** Step 1: the requester confirms the pre-submission check was done. */
export const PreCheckSection = ({ form }: PreCheckSectionProps) => {
  const { formatMessage } = useIntl();
  const { data, update, errors } = form;
  return (
    <FormSection
      titleId="rinf_lc_form_pre_check"
      hintId={`rinf_lc_form_pre_check_hint_${data.codeType}`}
    >
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={data.preSubmissionConfirmed}
              onChange={(event) =>
                update({ preSubmissionConfirmed: event.target.checked })
              }
            />
          }
          label={formatMessage({ id: "rinf_lc_field_pre_check" })}
        />
        {errors.preSubmissionConfirmed && (
          <FormHelperText error>
            {formatMessage({ id: errors.preSubmissionConfirmed })}
          </FormHelperText>
        )}
      </Box>
    </FormSection>
  );
};
