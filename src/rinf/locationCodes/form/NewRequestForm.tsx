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

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../store/hooks";
import { ChangeFields } from "./ChangeFields";
import { FormSection, useFieldError } from "./FormSection";
import { LocationElementField } from "./LocationElementField";
import { useRequestForm } from "./hooks/useRequestForm";
import { OperationSection } from "./OperationSection";
import { PrimaryCodeFields } from "./PrimaryCodeFields";
import { RequesterFields } from "./RequesterFields";
import { SubsidiaryCodeFields } from "./SubsidiaryCodeFields";

const FORM_MAX_WIDTH = 760;

/** Steps 1 and 2: the requester's check, then the request itself. */
export const NewRequestForm = () => {
  const { formatMessage } = useIntl();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const form = useRequestForm();
  const { data, update, errors, submit, submitting } = form;
  const fieldError = useFieldError(errors);
  const isRequester = actor.role === "requester";
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: FORM_MAX_WIDTH }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {formatMessage({ id: "rinf_lc_form_title" })}
      </Typography>
      {!isRequester && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {formatMessage({ id: "rinf_lc_form_switch_to_requester" })}
        </Alert>
      )}
      <Stack spacing={2}>
        <OperationSection form={form} />
        <FormSection
          titleId="rinf_lc_form_location"
          hintId={`rinf_lc_form_location_hint_${data.codeType}`}
        >
          <LocationElementField form={form} />
          {data.codeType === "primary" ? (
            <PrimaryCodeFields form={form} />
          ) : (
            <SubsidiaryCodeFields form={form} />
          )}
          <ChangeFields form={form} />
          <TextField
            size="small"
            multiline
            minRows={2}
            label={formatMessage({ id: "rinf_lc_field_justification" })}
            value={data.justification}
            onChange={(event) => update({ justification: event.target.value })}
            {...fieldError("justification", "rinf_lc_field_justification_hint")}
          />
        </FormSection>
        <RequesterFields form={form} />
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
        {hasErrors && (
          <Alert severity="error">
            {formatMessage({ id: "rinf_lc_form_has_errors" })}
          </Alert>
        )}
        <Box>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!isRequester || submitting}
          >
            {formatMessage({ id: "rinf_lc_form_submit" })}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};
