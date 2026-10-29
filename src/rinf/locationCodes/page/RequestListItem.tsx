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

import { Box, ListItemButton, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { CODE_TYPE_ABBREVIATIONS } from "../model/codeTypes";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { DeadlineLabel } from "./DeadlineLabel";
import { StatusChip } from "./StatusChip";

interface RequestListItemProps {
  request: LocationCodeRequest;
  selected: boolean;
  onOpen: (requestId: string) => void;
}

/** What a request is about, in a few words: a name or the code concerned. */
export const requestSubject = ({ data, decision }: LocationCodeRequest) =>
  data.locationName.trim() ||
  data.targetCode.trim() ||
  decision?.code ||
  data.proposedCode.trim();

/** Reference, type and operation, subject, status and deadline. */
export const RequestListItem = ({
  request,
  selected,
  onOpen,
}: RequestListItemProps) => {
  const { formatMessage } = useIntl();
  const { data, reference, status } = request;
  return (
    <ListItemButton
      selected={selected}
      onClick={() => onOpen(request.id)}
      sx={{ display: "block", borderBottom: 1, borderColor: "divider", py: 1 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", flex: 1 }}>
          {reference ?? formatMessage({ id: "rinf_lc_not_registered" })}
          {" · "}
          {CODE_TYPE_ABBREVIATIONS[data.codeType]}{" "}
          {formatMessage({ id: `rinf_lc_operation_${data.operation}` })}
        </Typography>
        <StatusChip status={status} />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600, my: 0.25 }} noWrap>
        {requestSubject(request) || "—"}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", flex: 1 }}
          noWrap
        >
          {data.requester.organisation || request.submittedBy}
        </Typography>
        <DeadlineLabel request={request} />
      </Box>
    </ListItemButton>
  );
};
