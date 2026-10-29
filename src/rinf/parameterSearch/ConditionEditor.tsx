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

import { MenuItem, Stack, TextField } from "@mui/material";
import { useEffect } from "react";
import { useIntl } from "react-intl";
import { ConditionOperator, needsValue } from "../models/parameterCriteria";
import {
  OPERATORS_BY_KIND,
  ValueInUse,
  ValueKind,
} from "../models/parameterValues";
import { ValueInput } from "./ValueInput";

interface ConditionEditorProps {
  operator: ConditionOperator;
  value: string;
  kind: ValueKind;
  values: ValueInUse[];
  /** The kind is only trusted once the chosen parameter's values are known. */
  valuesKnown: boolean;
  unit: string | null;
  onChange: (changes: { operator?: ConditionOperator; value?: string }) => void;
}

/** The comparison, then the value when the comparison needs one. */
export const ConditionEditor = ({
  operator,
  value,
  kind,
  values,
  valuesKnown,
  unit,
  onChange,
}: ConditionEditorProps) => {
  const { formatMessage } = useIntl();
  const operators = OPERATORS_BY_KIND[kind];

  // A new parameter can take another kind of value: start from its first comparison.
  useEffect(() => {
    if (valuesKnown && !operators.includes(operator)) {
      onChange({ operator: operators[0], value: "" });
    }
  }, [valuesKnown, operators, operator, onChange]);

  return (
    <Stack spacing={1.5}>
      <TextField
        select
        size="small"
        label={formatMessage({ id: "rinf_parameter_search_condition" })}
        value={operators.includes(operator) ? operator : operators[0]}
        onChange={(event) =>
          onChange({
            operator: event.target.value as ConditionOperator,
            value: "",
          })
        }
      >
        {operators.map((option) => (
          <MenuItem key={option} value={option}>
            {formatMessage({ id: `rinf_parameter_search_operator_${option}` })}
          </MenuItem>
        ))}
      </TextField>
      {needsValue(operator) && (
        <ValueInput
          kind={kind}
          value={value}
          values={values}
          loading={!valuesKnown}
          unit={unit}
          onChange={(next) => onChange({ value: next })}
        />
      )}
    </Stack>
  );
};
