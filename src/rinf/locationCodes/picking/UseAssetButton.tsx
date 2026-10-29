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

import { Button } from "@mui/material";
import type { MouseEvent } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../store/hooks";
import { DETAILS_KINDS } from "../../detailsKinds";
import type { DetailsNode } from "../../models/detailsTree";
import { isLocationAssetClass } from "../model/rinfLink";
import { usePickTarget } from "./usePickTarget";

interface UseAssetButtonProps {
  node: DetailsNode;
}

/**
 * Beside a track, siding, platform edge or tunnel in the panel, while
 * picking for an SLC: positions the code on that asset. Shows nothing for
 * other objects, or when only OPs and sections of line may be picked.
 */
export const UseAssetButton = ({ node }: UseAssetButtonProps) => {
  const { formatMessage } = useIntl();
  const { picking, choose } = usePickTarget();
  const { kind, canonicalId, roots } = useAppSelector(
    (state) => state.rinf.details,
  );
  if (!picking?.allowAssets || !kind || !canonicalId) return null;
  if (!isLocationAssetClass(node.classUri) || !node.canonicalUri) return null;
  const rootLabel = roots[0]?.label ?? "";
  const parentName = rootLabel
    ? DETAILS_KINDS[kind].displayName(rootLabel)
    : canonicalId;

  const handleClick = (event: MouseEvent) => {
    // Inside an accordion header: choosing must not also fold it.
    event.stopPropagation();
    choose({
      kind: "asset",
      canonicalId: node.canonicalUri!,
      label: node.label || node.canonicalUri!,
      assetClass: node.classLabel ?? undefined,
      parent: { kind, canonicalId, label: parentName },
    });
  };

  return (
    <Button
      size="small"
      variant="outlined"
      onClick={handleClick}
      onFocus={(event) => event.stopPropagation()}
      sx={{ flexShrink: 0, mr: 1, alignSelf: "center", whiteSpace: "nowrap" }}
    >
      {formatMessage({ id: "rinf_lc_use_asset" })}
    </Button>
  );
};
