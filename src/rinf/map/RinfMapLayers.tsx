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

import { RinfLoadingIndicator } from "./RinfLoadingIndicator";
import { RinfOperationalPointsLayer } from "./RinfOperationalPointsLayer";
import { RinfSectionsOfLineLayer } from "./RinfSectionsOfLineLayer";

/**
 * Every RINF layer, in drawing order: lines first so OP circles sit on top.
 * The upstream map renders only this component, so new layers need no
 * further change there.
 */
export const RinfMapLayers = () => (
  <>
    <RinfSectionsOfLineLayer />
    <RinfOperationalPointsLayer />
    <RinfLoadingIndicator />
  </>
);
