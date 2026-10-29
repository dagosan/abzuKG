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

import CheckIcon from "@mui/icons-material/Check";
import { Box, Button } from "@mui/material";
import { useIntl } from "react-intl";
import type { DetailsKind } from "../../detailsKinds";
import { elementLink } from "../model/rinfLink";
import { usePickTarget } from "./usePickTarget";

interface UseElementButtonProps {
  kind: DetailsKind;
  canonicalId: string;
  name: string;
}

/** In the panel while picking: positions the code on this OP or section of line. */
export const UseElementButton = ({
  kind,
  canonicalId,
  name,
}: UseElementButtonProps) => {
  const { formatMessage } = useIntl();
  const { choose } = usePickTarget();
  return (
    <Box sx={{ px: 2, pb: 1 }}>
      <Button
        variant="contained"
        size="small"
        startIcon={<CheckIcon />}
        onClick={() => choose(elementLink(kind, canonicalId, name))}
      >
        {formatMessage({ id: `rinf_lc_use_${kind}` })}
      </Button>
    </Box>
  );
};
