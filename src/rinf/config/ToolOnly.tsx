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

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { RinfToolFeatures, useRinfTool } from "./rinfTool";

type ToolFeature = "rinfReports" | "locationCodes";

interface ToolOnlyProps {
  feature: ToolFeature;
  children: ReactNode;
  /** Where a page of the other tool sends the visitor; nothing is shown when unset. */
  redirectTo?: string;
}

/** Shows its content only in a deployment whose tool has `feature`. */
export const ToolOnly = ({ feature, children, redirectTo }: ToolOnlyProps) => {
  const features: RinfToolFeatures = useRinfTool();
  if (features[feature]) return <>{children}</>;
  return redirectTo ? <Navigate to={redirectTo} replace /> : null;
};
