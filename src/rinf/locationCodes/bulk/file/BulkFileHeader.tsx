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

Added for the ERA Location Code Manager, 2026-11-10. */

import { Box, Chip, Stack, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import type {
  LocationCodeRequest,
  RequestStatus,
} from "../../model/LocationCodeRequest";
import { bulkReferenceOf } from "../bulkRequests";

interface BulkFileHeaderProps {
  lines: LocationCodeRequest[];
}

/** How many lines stand in each status, in the order they first appear. */
const statusCounts = (
  lines: LocationCodeRequest[],
): [RequestStatus, number][] => {
  const counts = new Map<RequestStatus, number>();
  lines.forEach(({ status }) =>
    counts.set(status, (counts.get(status) ?? 0) + 1),
  );
  return [...counts.entries()];
};

/** The bulk request as a whole: reference, file, who sent it, T0, and where its lines stand. */
export const BulkFileHeader = ({ lines }: BulkFileHeaderProps) => {
  const { formatMessage, formatDate } = useIntl();
  const [first] = lines;
  const reference = bulkReferenceOf(lines);
  const date = (instant: string): string =>
    formatDate(instant, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", lineHeight: 1.5 }}
      >
        {reference ?? formatMessage({ id: "rinf_lc_not_registered" })}
        {" · "}
        {formatMessage(
          { id: "rinf_lc_bulk_file_overline" },
          { count: lines.length },
        )}
      </Typography>
      <Typography
        variant="h6"
        component="h2"
        sx={{ color: "primary.main", fontWeight: 700 }}
      >
        {first.bulk?.fileName}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {formatMessage(
          { id: "rinf_lc_submitted_by" },
          {
            name: first.submittedBy,
            organisation: first.data.requester.organisation,
            date: date(first.submittedAt),
          },
        )}
        {first.registeredAt &&
          ` · ${formatMessage(
            { id: "rinf_lc_bulk_registered_at" },
            { date: date(first.registeredAt) },
          )}`}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}
      >
        {statusCounts(lines).map(([status, count]) => (
          <Chip
            key={status}
            size="small"
            variant="outlined"
            label={`${count} · ${formatMessage({ id: `rinf_lc_status_${status}` })}`}
          />
        ))}
      </Stack>
    </Box>
  );
};
