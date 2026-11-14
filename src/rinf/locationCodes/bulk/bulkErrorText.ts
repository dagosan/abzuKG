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

Added for the ERA Location Code Manager, 2026-11-14. */

import type { IntlShape } from "react-intl";

/** An error from the store: one of our text keys, or the register's own words. */
export const errorText = (
  error: string,
  formatMessage: IntlShape["formatMessage"],
): string =>
  error.startsWith("rinf_lc_") ? formatMessage({ id: error }) : error;
