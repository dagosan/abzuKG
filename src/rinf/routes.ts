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

Added for the ERA RINF frontend, 2026-10-28. */

/** Route segment for the SoL panel: /section-of-line/:canonicalId. */
export const SECTION_OF_LINE_ROUTE = "section-of-line";
export const SECTION_OF_LINE_PARAM = "canonicalId";

/** Path that opens the panel for one SoL, e.g. /section-of-line/1440_BELGB_BECAD. */
export const sectionOfLinePath = (canonicalId: string): string =>
  `/${SECTION_OF_LINE_ROUTE}/${encodeURIComponent(canonicalId)}`;
