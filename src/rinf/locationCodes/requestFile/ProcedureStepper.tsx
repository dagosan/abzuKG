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
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useIntl } from "react-intl";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { needsRinfHarmonisation, STEP_OF_STATUS } from "../workflow/routing";

/** Procedure section 8, steps 1 to 8. Text keys rinf_lc_step_<n>. */
const STEP_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];
const RINF_STEP = 5;
const DECISION_STEP = 6;
const PUBLICATION_STEP = 7;

interface ProcedureStepperProps {
  request: LocationCodeRequest;
}

/** Where the request is in the eight steps; skipped steps say so. */
export const ProcedureStepper = ({ request }: ProcedureStepperProps) => {
  const { formatMessage } = useIntl();
  const current = STEP_OF_STATUS[request.status];
  const rejected = request.decision?.outcome === "reject";
  const isSkipped = (step: number) =>
    (step === RINF_STEP && !needsRinfHarmonisation(request)) ||
    (step === PUBLICATION_STEP && rejected);
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("md"));

  // Eight labelled steps do not fit a phone: say where the request is.
  if (isNarrow) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {current > STEP_NUMBERS.length
          ? formatMessage({ id: "rinf_lc_steps_done" })
          : formatMessage(
              { id: "rinf_lc_step_of" },
              {
                step: current,
                total: STEP_NUMBERS.length,
                name: formatMessage({ id: `rinf_lc_step_${current}` }),
              },
            )}
      </Typography>
    );
  }

  return (
    <Stepper
      activeStep={current - 1}
      alternativeLabel
      sx={{ overflowX: "auto", py: 1 }}
    >
      {STEP_NUMBERS.map((step) => (
        <Step key={step} completed={step < current && !isSkipped(step)}>
          <StepLabel
            error={step === DECISION_STEP && rejected}
            optional={
              isSkipped(step) ? (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {formatMessage({ id: "rinf_lc_step_skipped" })}
                </Typography>
              ) : undefined
            }
          >
            {formatMessage({ id: `rinf_lc_step_${step}` })}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};
