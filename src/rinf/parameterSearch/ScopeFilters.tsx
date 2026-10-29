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

import { Autocomplete, Stack, TextField } from "@mui/material";
import { useIntl } from "react-intl";
import type {
  CountryOption,
  InfrastructureManagerOption,
  ScopeOptions,
} from "../models/scopeOptions";

interface ScopeFiltersProps {
  options: ScopeOptions | null;
  countries: string[];
  infrastructureManagers: string[];
  onChange: (changes: {
    countries?: string[];
    infrastructureManagers?: string[];
  }) => void;
}

/** "0088 · BEL": IMs have only an organisation code in the data, no name. */
const managerLabel = ({ code, countries }: InfrastructureManagerOption) =>
  `${code} · ${countries.join(", ")}`;

/** Optional limits: any of the chosen countries, and/or any of the chosen IMs. */
export const ScopeFilters = ({
  options,
  countries,
  infrastructureManagers,
  onChange,
}: ScopeFiltersProps) => {
  const { formatMessage } = useIntl();
  const countryOptions = options?.countries ?? [];
  const managerOptions = options?.infrastructureManagers ?? [];
  const anyLabel = formatMessage({ id: "rinf_parameter_search_any" });

  return (
    <Stack spacing={1.5}>
      <Autocomplete<CountryOption, true>
        multiple
        size="small"
        loading={!options}
        options={countryOptions}
        value={countryOptions.filter((option) =>
          countries.includes(option.code),
        )}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.code === value.code}
        onChange={(_event, chosen) =>
          onChange({ countries: chosen.map((option) => option.code) })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={formatMessage({ id: "rinf_parameter_search_countries" })}
            placeholder={countries.length === 0 ? anyLabel : undefined}
          />
        )}
      />
      <Autocomplete<InfrastructureManagerOption, true>
        multiple
        size="small"
        loading={!options}
        options={managerOptions}
        value={managerOptions.filter((option) =>
          infrastructureManagers.includes(option.code),
        )}
        getOptionLabel={managerLabel}
        isOptionEqualToValue={(option, value) => option.code === value.code}
        onChange={(_event, chosen) =>
          onChange({
            infrastructureManagers: chosen.map((option) => option.code),
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={formatMessage({ id: "rinf_parameter_search_ims" })}
            placeholder={
              infrastructureManagers.length === 0 ? anyLabel : undefined
            }
          />
        )}
      />
    </Stack>
  );
};
