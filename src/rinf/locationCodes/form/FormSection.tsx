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

import { Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";
import type {
  AdmissibilityErrors,
  RequestField,
} from "../checks/admissibility";

interface FormSectionProps {
  titleId: string;
  hintId?: string;
  children: ReactNode;
}

/** A titled group of fields. */
export const FormSection = ({
  titleId,
  hintId,
  children,
}: FormSectionProps) => {
  const { formatMessage } = useIntl();
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
        {formatMessage({ id: titleId })}
      </Typography>
      {hintId && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          {formatMessage({ id: hintId })}
        </Typography>
      )}
      <Stack spacing={2} sx={{ mt: 1.5 }}>
        {children}
      </Stack>
    </Paper>
  );
};

/**
 * Props giving a TextField its error state and message: the error, else
 * the hint, marked "from RINF" while the value is RINF's and not edited.
 */
export const useFieldError = (
  errors: AdmissibilityErrors,
  fromRinf: RequestField[] = [],
) => {
  const { formatMessage } = useIntl();
  return (field: RequestField, hintId?: string) => {
    const errorId = errors[field];
    if (errorId)
      return { error: true, helperText: formatMessage({ id: errorId }) };
    const hint = hintId ? formatMessage({ id: hintId }) : undefined;
    if (!fromRinf.includes(field)) return { error: false, helperText: hint };
    const mark = formatMessage({ id: "rinf_lc_from_rinf" });
    return { error: false, helperText: hint ? `${mark} · ${hint}` : mark };
  };
};
