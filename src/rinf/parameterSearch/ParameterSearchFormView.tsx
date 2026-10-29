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

import { Button, Stack, Typography } from "@mui/material";
import type { FormEvent } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../store/hooks";
import { ERA_NAMESPACE } from "../api/queryParts";
import { distinctAttachments } from "../models/parameterAttachments";
import { ConditionEditor } from "./ConditionEditor";
import type { ParameterSearchForm } from "./hooks/useParameterSearchForm";
import type { ParameterProfile } from "./hooks/useParameterProfile";
import { ParameterPicker } from "./ParameterPicker";
import { ScopeFilters } from "./ScopeFilters";

interface ParameterSearchFormViewProps {
  form: ParameterSearchForm;
  profile: ParameterProfile;
}

/** Parameter, condition, optional countries and IMs, then Search. */
export const ParameterSearchFormView = ({
  form,
  profile,
}: ParameterSearchFormViewProps) => {
  const { formatMessage } = useIntl();
  const { draft, update, submit, canSubmit } = form;
  const { carriers, scopeOptions, values, valuesKnown, valueKind } = profile;
  const dictionary = useAppSelector(
    (state) => state.rinf.parameterDictionary.entries,
  );
  const unit = dictionary[`${ERA_NAMESPACE}${draft.property}`]?.unit ?? null;
  const reachesNothing =
    carriers !== undefined && distinctAttachments(carriers).length === 0;
  const ready = canSubmit && carriers !== undefined && scopeOptions !== null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <Stack
      component="form"
      spacing={1.5}
      sx={{ px: 2, pb: 2 }}
      onSubmit={handleSubmit}
    >
      <ParameterPicker
        property={draft.property}
        onChange={(property) => update({ property, value: "" })}
      />
      {draft.property && (
        <ConditionEditor
          operator={draft.operator}
          value={draft.value}
          kind={valueKind}
          values={values}
          valuesKnown={valuesKnown}
          unit={unit}
          onChange={update}
        />
      )}
      {reachesNothing && (
        <Typography variant="body2" sx={{ color: "warning.main" }}>
          {formatMessage({ id: "rinf_parameter_search_unplaced" })}
        </Typography>
      )}
      <ScopeFilters
        options={scopeOptions}
        countries={draft.countries}
        infrastructureManagers={draft.infrastructureManagers}
        onChange={update}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={!ready || reachesNothing}
      >
        {formatMessage({ id: "rinf_parameter_search_submit" })}
      </Button>
    </Stack>
  );
};
