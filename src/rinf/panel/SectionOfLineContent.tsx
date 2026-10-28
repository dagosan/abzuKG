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
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../store/hooks";
import type { DetailsNode } from "../models/SectionOfLineDetails";
import { ParameterList } from "./ParameterList";
import { TrackAccordion } from "./TrackAccordion";
import { toDisplayNode } from "./visibleParameters";

interface SectionOfLineContentProps {
  details: DetailsNode;
  filter: string;
}

/** The SoL's own parameters, then one collapsible block per track. */
export const SectionOfLineContent = ({
  details,
  filter,
}: SectionOfLineContentProps) => {
  const { formatMessage } = useIntl();
  const dictionary = useAppSelector(
    (state) => state.rinf.parameterDictionary.entries,
  );
  const displayed = useMemo(
    () => toDisplayNode(details, dictionary, filter),
    [details, dictionary, filter],
  );
  const firstTrackUri = details.children[0]?.uri;
  const [expandedUris, setExpandedUris] = useState<Set<string>>(
    () => new Set(firstTrackUri ? [firstTrackUri] : []),
  );
  const filtering = filter.trim().length > 0;

  const toggle = (uri: string) =>
    setExpandedUris((current) => {
      const next = new Set(current);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });

  if (!displayed) {
    return (
      <Typography variant="body2" sx={{ p: 2, color: "text.secondary" }}>
        {formatMessage({ id: "rinf_no_matching_parameters" })}
      </Typography>
    );
  }

  return (
    <Box>
      <Box component="section" sx={{ px: 2, pb: 2 }}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
          {formatMessage({ id: "rinf_section_of_line" })}
        </Typography>
        <ParameterList parameters={displayed.parameters} />
      </Box>
      {displayed.children.map((track) => (
        <TrackAccordion
          key={track.node.uri}
          displayNode={track}
          expanded={filtering || expandedUris.has(track.node.uri)}
          onToggle={() => toggle(track.node.uri)}
        />
      ))}
    </Box>
  );
};
