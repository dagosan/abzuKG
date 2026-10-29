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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useIntl } from "react-intl";
import {
  CODE_TYPES,
  CodeType,
  REQUEST_OPERATIONS,
  RequestOperation,
} from "../model/codeTypes";
import { FormSection } from "./FormSection";
import type { RequestForm } from "./hooks/useRequestForm";

interface OperationSectionProps {
  form: RequestForm;
}

/** What is asked: which operation, on which code type. */
export const OperationSection = ({ form }: OperationSectionProps) => {
  const { formatMessage } = useIntl();
  const { data, update } = form;
  // On a phone the choices are stacked, full width, so none is cut off.
  const isPhone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const groupLayout = {
    orientation: isPhone ? "vertical" : "horizontal",
    fullWidth: isPhone,
  } as const;
  return (
    <FormSection titleId="rinf_lc_form_what">
      <ToggleButtonGroup
        exclusive
        size="small"
        color="primary"
        {...groupLayout}
        value={data.codeType}
        onChange={(_event, value: CodeType | null) =>
          value && update({ codeType: value })
        }
      >
        {CODE_TYPES.map((type) => (
          <ToggleButton key={type} value={type} sx={{ textTransform: "none" }}>
            {formatMessage({ id: `rinf_lc_code_type_${type}` })}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <ToggleButtonGroup
        exclusive
        size="small"
        color="primary"
        {...groupLayout}
        value={data.operation}
        onChange={(_event, value: RequestOperation | null) =>
          value && update({ operation: value })
        }
        sx={{ flexWrap: "wrap" }}
      >
        {REQUEST_OPERATIONS.map((operation) => (
          <ToggleButton
            key={operation}
            value={operation}
            sx={{ textTransform: "none" }}
          >
            {formatMessage({ id: `rinf_lc_operation_${operation}` })}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {formatMessage({ id: `rinf_lc_operation_hint_${data.operation}` })}
      </Typography>
    </FormSection>
  );
};
