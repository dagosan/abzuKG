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

Added for the ERA RINF frontend, 2026-10-28. */

import { Box } from "@mui/material";
import { ParameterRow } from "./ParameterRow";
import type { DisplayParameter } from "./visibleParameters";

interface ParameterListProps {
  parameters: DisplayParameter[];
}

export const ParameterList = ({ parameters }: ParameterListProps) => {
  if (parameters.length === 0) return null;
  return (
    <Box component="ul" sx={{ m: 0, p: 0 }}>
      {parameters.map((parameter) => (
        <ParameterRow key={parameter.propertyUri} parameter={parameter} />
      ))}
    </Box>
  );
};
