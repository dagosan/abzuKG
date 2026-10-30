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

Added for the ERA RINF frontend, 2026-10-30. */

import { useIntl } from "react-intl";
import { useRinfTool } from "./rinfTool";

/** The application's name for this deployment: "RINF Viewer" or "Location Code Manager". */
export const useRinfAppTitle = (): string => {
  const { formatMessage } = useIntl();
  const { titleId } = useRinfTool();
  return formatMessage({ id: titleId });
};
