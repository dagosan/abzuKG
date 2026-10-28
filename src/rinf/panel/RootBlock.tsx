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

import { Box, Typography } from "@mui/material";
import { ParameterList } from "./ParameterList";
import { TrackAccordion } from "./TrackAccordion";
import type { DisplayNode } from "./visibleParameters";

interface RootBlockProps {
  title: string;
  displayNode: DisplayNode;
  isExpanded: (uri: string) => boolean;
  onToggle: (uri: string) => void;
}

/** The element's own parameters, then one collapsible block per part. */
export const RootBlock = ({
  title,
  displayNode,
  isExpanded,
  onToggle,
}: RootBlockProps) => (
  <Box sx={{ mb: 2 }}>
    <Box component="section" sx={{ px: 2, pb: 2 }}>
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <ParameterList parameters={displayNode.parameters} />
    </Box>
    {displayNode.children.map((part) => (
      <TrackAccordion
        key={part.node.uri}
        displayNode={part}
        expanded={isExpanded(part.node.uri)}
        onToggle={() => onToggle(part.node.uri)}
      />
    ))}
  </Box>
);
