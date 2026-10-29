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

import PinOutlinedIcon from "@mui/icons-material/PinOutlined";
import { Box, Button } from "@mui/material";
import { useIntl } from "react-intl";
import { Link as RouterLink } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { isCountryPrefix } from "../model/countries";
import { newRequestPath, PREFILL_PARAMS } from "./locationCodesPath";

const COUNTRY_PREFIX_LENGTH = 2;

interface RequestCodeLinkProps {
  canonicalId: string;
  name: string;
}

/**
 * In an OP's panel: opens a new location code request positioned on this
 * OP, for a requester only. The country is taken from the UOPID, which
 * starts with it.
 */
export const RequestCodeLink = ({
  canonicalId,
  name,
}: RequestCodeLinkProps) => {
  const { formatMessage } = useIntl();
  const role = useAppSelector((state) => state.rinf.locationCodes.actor.role);
  const prefix = canonicalId.slice(0, COUNTRY_PREFIX_LENGTH).toUpperCase();
  const prefill = new URLSearchParams({
    [PREFILL_PARAMS.operationalPoint]: canonicalId,
    [PREFILL_PARAMS.name]: name,
    ...(isCountryPrefix(prefix) && { [PREFILL_PARAMS.country]: prefix }),
  });
  // Only a requester asks for codes; Agency roles never see this.
  if (role !== "requester") return null;
  return (
    <Box sx={{ px: 2, pb: 1 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<PinOutlinedIcon fontSize="small" />}
        component={RouterLink}
        to={newRequestPath(prefill)}
      >
        {formatMessage({ id: "rinf_lc_request_for_op" })}
      </Button>
    </Box>
  );
};
