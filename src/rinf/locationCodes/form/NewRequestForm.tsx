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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { ChangeFields } from "./ChangeFields";
import { FormSection, useFieldError } from "./FormSection";
import { LocationElementField } from "./LocationElementField";
import { useRequestForm } from "./hooks/useRequestForm";
import { OperationSection } from "./OperationSection";
import { PreCheckSection } from "./PreCheckSection";
import { PrimaryCodeFields } from "./PrimaryCodeFields";
import { RequesterFields } from "./RequesterFields";
import { SubsidiaryCodeFields } from "./SubsidiaryCodeFields";

/** One column up to laptop width; on wider screens the request on the left
 *  and the requester, check and submit on the right. */
const FORM_MAX_WIDTH = { md: 760, lg: 1320 };
const COLUMNS = {
  xs: "minmax(0, 1fr)",
  lg: "minmax(0, 7fr) minmax(0, 5fr)",
};
const COLUMN_GAP = { xs: 2, lg: 3 };

/** Steps 1 and 2: the requester's check, then the request itself. */
export const NewRequestForm = () => {
  const { formatMessage } = useIntl();
  const form = useRequestForm();
  const { data, update, errors, submit, submitting } = form;
  const fieldError = useFieldError(errors);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: FORM_MAX_WIDTH, mx: "auto" }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {formatMessage({ id: "rinf_lc_form_title" })}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: COLUMNS,
          gap: COLUMN_GAP,
          alignItems: "start",
        }}
      >
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
              onChange={(event) =>
                update({ justification: event.target.value })
              }
              {...fieldError(
                "justification",
                "rinf_lc_field_justification_hint",
              )}
            />
          </FormSection>
        </Stack>
        <Stack spacing={2}>
          <RequesterFields form={form} />
          <PreCheckSection form={form} />
          {hasErrors && (
            <Alert severity="error">
              {formatMessage({ id: "rinf_lc_form_has_errors" })}
            </Alert>
          )}
          <Box>
            <Button
              variant="contained"
              onClick={submit}
              disabled={submitting}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {formatMessage({ id: "rinf_lc_form_submit" })}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};
