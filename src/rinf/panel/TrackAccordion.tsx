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

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { LinkedObjectSection } from "./LinkedObjectSection";
import { ParameterList } from "./ParameterList";
import type { DisplayNode } from "./visibleParameters";

interface TrackAccordionProps {
  displayNode: DisplayNode;
  expanded: boolean;
  onToggle: () => void;
}

const countParameters = ({ parameters, children }: DisplayNode): number =>
  parameters.length +
  children.reduce((total, child) => total + countParameters(child), 0);

/** One track of the SoL: its own parameters, then each object it links to. */
export const TrackAccordion = ({
  displayNode,
  expanded,
  onToggle,
}: TrackAccordionProps) => {
  const { formatMessage } = useIntl();
  const { title, parameters, children } = displayNode;
  const count = countParameters(displayNode);

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: 700, flex: 1 }}
        >
          {title}
        </Typography>
        <Chip
          size="small"
          label={formatMessage({ id: "rinf_parameter_count" }, { count })}
          sx={{ mr: 1 }}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <ParameterList parameters={parameters} />
        {children.map((child) => (
          <LinkedObjectSection key={child.node.uri} displayNode={child} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};
