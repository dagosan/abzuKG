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

import { Chip, ChipProps } from "@mui/material";
import { useIntl } from "react-intl";
import type { RequestStatus } from "../model/LocationCodeRequest";

/** Colour by what the status means for the requester, not by step. */
const STATUS_COLOURS: Record<RequestStatus, ChipProps["color"]> = {
  submitted: "info",
  registered: "info",
  informationRequested: "warning",
  rinfHarmonisation: "info",
  externalCoordination: "info",
  awaitingDecision: "secondary",
  underReview: "warning",
  assigned: "success",
  published: "success",
  rejected: "error",
  closed: "default",
};

interface StatusChipProps {
  status: RequestStatus;
}

export const StatusChip = ({ status }: StatusChipProps) => {
  const { formatMessage } = useIntl();
  return (
    <Chip
      size="small"
      color={STATUS_COLOURS[status]}
      variant={status === "closed" ? "outlined" : "filled"}
      label={formatMessage({ id: `rinf_lc_status_${status}` })}
    />
  );
};
