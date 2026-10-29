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

import { Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";

const LABEL_MIN_WIDTH = 140;

interface RequestFileSectionProps {
  titleId: string;
  children: ReactNode;
}

/** A titled part of the request file. */
export const RequestFileSection = ({
  titleId,
  children,
}: RequestFileSectionProps) => {
  const { formatMessage } = useIntl();
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography
        variant="subtitle1"
        component="h3"
        sx={{ fontWeight: 600, mb: 1 }}
      >
        {formatMessage({ id: titleId })}
      </Typography>
      {children}
    </Paper>
  );
};

interface FactListProps {
  facts: [string, ReactNode][];
}

/** Label–value lines; empty values are left out. */
export const FactList = ({ facts }: FactListProps) => {
  const { formatMessage } = useIntl();
  const shown = facts.filter(
    ([, value]) => value !== "" && value !== null && value !== undefined,
  );
  return (
    <Typography
      component="dl"
      variant="body2"
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: `minmax(${LABEL_MIN_WIDTH}px, max-content) 1fr`,
        },
        columnGap: 2,
        rowGap: 0.5,
        m: 0,
      }}
    >
      {shown.map(([labelId, value]) => (
        <span key={labelId} style={{ display: "contents" }}>
          <Typography
            component="dt"
            variant="body2"
            sx={{ color: "text.secondary" }}
          >
            {formatMessage({ id: labelId })}
          </Typography>
          <Typography
            component="dd"
            variant="body2"
            sx={{ m: 0, overflowWrap: "anywhere" }}
          >
            {value}
          </Typography>
        </span>
      ))}
    </Typography>
  );
};
