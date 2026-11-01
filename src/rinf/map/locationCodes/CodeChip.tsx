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

Added for the ERA RINF frontend, 2026-11-01. */

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import type { CodeSource } from "./codeLabelTypes";

const CHIP_FONT_SIZE = 11;

/**
 * One look per source, so RINF's codes and the register's read apart at a
 * glance: RINF only → outlined like the OP dots (secondary); register and RINF
 * agree → filled ERA blue; register only, not (yet) in RINF → dashed blue.
 */
const SOURCE_STYLES: Record<CodeSource, SxProps<Theme>> = {
  rinf: {
    bgcolor: "background.paper",
    color: "text.primary",
    borderStyle: "solid",
    borderColor: "secondary.main",
  },
  registerAndRinf: {
    bgcolor: "primary.main",
    color: "primary.contrastText",
    borderStyle: "solid",
    borderColor: "primary.main",
  },
  register: {
    bgcolor: "background.paper",
    color: "primary.main",
    borderStyle: "dashed",
    borderColor: "primary.main",
  },
};

interface CodeChipProps {
  text: string;
  source: CodeSource;
  title?: string;
}

/** A location code as a small tag; also used in the legend. */
export const CodeChip = ({ text, source, title }: CodeChipProps) => (
  <Box
    component="span"
    title={title}
    sx={[
      {
        display: "inline-block",
        px: 0.5,
        borderWidth: 1,
        borderRadius: 1,
        fontSize: CHIP_FONT_SIZE,
        fontWeight: 600,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
        boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
      },
      SOURCE_STYLES[source] as object,
    ]}
  >
    {text}
  </Box>
);
