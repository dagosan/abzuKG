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

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Stack,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { RequesterFields } from "../form/RequesterFields";
import { errorText } from "../masterData/validityText";
import { acceptedLines, BulkReport, refusedLines } from "./bulkReport";
import { useBulkSubmit } from "./hooks/useBulkSubmit";

const SECTION_MAX_WIDTH = 760;

interface BulkSubmitSectionProps {
  report: BulkReport;
}

/**
 * Sends the accepted lines to the Agency as one request (FR-08): who asks,
 * the confirmation of step 1 for every line, and the button. Refused lines
 * stay out; they can be corrected and sent in another file.
 */
export const BulkSubmitSection = ({ report }: BulkSubmitSectionProps) => {
  const { formatMessage } = useIntl();
  const { form, confirmed, setConfirmed, submitting, error, submit } =
    useBulkSubmit(report);
  const accepted = acceptedLines(report).length;
  const refused = refusedLines(report).length;
  const confirmationError = form.errors.preSubmissionConfirmed;

  return (
    <Stack spacing={2} sx={{ maxWidth: SECTION_MAX_WIDTH }}>
      <Box>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
          {formatMessage({ id: "rinf_lc_bulk_submit_title" })}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatMessage(
            { id: "rinf_lc_bulk_submit_hint" },
            { accepted, refused },
          )}
        </Typography>
      </Box>
      <RequesterFields form={form} />
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
          }
          label={formatMessage({ id: "rinf_lc_bulk_pre_check" })}
        />
        {confirmationError && (
          <FormHelperText error>
            {formatMessage({ id: confirmationError })}
          </FormHelperText>
        )}
      </Box>
      {error && (
        <Alert severity="error">{errorText(error, formatMessage)}</Alert>
      )}
      <Box>
        <Button variant="contained" onClick={submit} disabled={submitting}>
          {formatMessage({ id: "rinf_lc_bulk_submit" }, { accepted })}
        </Button>
      </Box>
    </Stack>
  );
};
