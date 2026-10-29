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
import { Tab, TabProps } from "@mui/material";
import { useIntl } from "react-intl";

/** Value of the location codes tab in Abzu's navigation tabs. */
export const LOCATION_CODES_TAB = "locationCodes";

/** The "Location codes" tab; <Tabs> hands it its selection props. */
export const LocationCodesTab = (props: TabProps) => {
  const { formatMessage } = useIntl();
  return (
    <Tab
      {...props}
      icon={<PinOutlinedIcon fontSize="small" />}
      iconPosition="start"
      label={formatMessage({ id: "rinf_lc_tab" })}
    />
  );
};
