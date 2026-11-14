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

import { Alert, Box, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { useSearchParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { DRAFT_PARAM } from "../page/locationCodesPath";
import { RequestFormContent } from "./RequestFormContent";

/**
 * The new request form, or a saved draft continued (?draft=<id>): the form
 * opens once the requester's drafts are there, with the draft's values.
 */
export const NewRequestForm = () => {
  const { formatMessage } = useIntl();
  const [params] = useSearchParams();
  const draftId = params.get(DRAFT_PARAM);
  const isFound = useAppSelector((state) =>
    state.rinf.locationCodes.savedDrafts.some((draft) => draft.id === draftId),
  );
  const isLoading = useAppSelector(
    (state) => state.rinf.locationCodes.savedDraftsLoadStatus === "loading",
  );
  const isMissing = draftId !== null && !isFound;

  if (isMissing && isLoading)
    return (
      <Typography variant="body2" sx={{ p: 3, color: "text.secondary" }}>
        {formatMessage({ id: "rinf_lc_draft_loading" })}
      </Typography>
    );
  return (
    <>
      {isMissing && (
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
          <Alert severity="warning">
            {formatMessage({ id: "rinf_lc_draft_not_found" })}
          </Alert>
        </Box>
      )}
      <RequestFormContent key={isMissing ? "new" : (draftId ?? "new")} />
    </>
  );
};
