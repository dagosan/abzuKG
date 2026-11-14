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
import { useAppSelector } from "../../../store/hooks";
import { todayIsoDate } from "../../api/queryParts";
import { useMasterData } from "../state/useMasterData";
import { CountryTable } from "./CountryTable";
import { useCanEditMasterData } from "./hooks/useCanEditMasterData";
import { SubsidiaryTypeTable } from "./SubsidiaryTypeTable";

/**
 * The master data the workflow's rules read (LCMS specification FR-27): the
 * countries codes are assigned for and the subsidiary location code types.
 * Everyone can read them; the code administrator maintains them.
 */
export const MasterDataPage = () => {
  const { formatMessage } = useIntl();
  const { countries, subsidiaryTypes } = useMasterData();
  const loadFailed = useAppSelector(
    (state) => state.rinf.locationCodes.masterDataLoadStatus === "failed",
  );
  const canEdit = useCanEditMasterData();
  const today = todayIsoDate();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" component="h2">
        {formatMessage({ id: "rinf_lc_md_title" })}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        {formatMessage({ id: "rinf_lc_md_hint" })}{" "}
        {formatMessage({
          id: canEdit ? "rinf_lc_md_hint_editor" : "rinf_lc_md_hint_reader",
        })}
      </Typography>
      {loadFailed && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {formatMessage({ id: "rinf_lc_md_load_failed" })}
        </Alert>
      )}
      <CountryTable countries={countries} canEdit={canEdit} today={today} />
      <SubsidiaryTypeTable
        subsidiaryTypes={subsidiaryTypes}
        canEdit={canEdit}
        today={today}
      />
    </Box>
  );
};
