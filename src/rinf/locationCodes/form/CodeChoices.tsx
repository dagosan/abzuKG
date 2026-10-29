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

import { Box, Chip } from "@mui/material";
import type { CodeChoice } from "./rinfAutofill";

interface CodeChoicesProps {
  choices: CodeChoice[];
  /** The code currently in the field. */
  selected: string;
  onChoose: (code: string) => void;
}

/** The element's codes, one chip each; the one in the field is filled. */
export const CodeChoices = ({
  choices,
  selected,
  onChoose,
}: CodeChoicesProps) => (
  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
    {choices.map(({ code, name }) => (
      <Chip
        key={code}
        size="small"
        clickable
        color="primary"
        variant={code === selected ? "filled" : "outlined"}
        label={name ? `${code} · ${name}` : code}
        onClick={() => onChoose(code)}
      />
    ))}
  </Box>
);
