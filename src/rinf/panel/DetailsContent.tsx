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

import { Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../store/hooks";
import { DetailsKind, DETAILS_KINDS } from "../detailsKinds";
import type { DetailsNode } from "../models/detailsTree";
import { RootBlock } from "./RootBlock";
import { DisplayNode, toDisplayNode } from "./visibleParameters";

interface DetailsContentProps {
  kind: DetailsKind;
  roots: DetailsNode[];
  filter: string;
}

/**
 * One block per declaration of the element: usually one, two for a border
 * point declared by both neighbouring IMs.
 */
export const DetailsContent = ({
  kind,
  roots,
  filter,
}: DetailsContentProps) => {
  const { formatMessage } = useIntl();
  const dictionary = useAppSelector(
    (state) => state.rinf.parameterDictionary.entries,
  );
  const displayed = useMemo(
    () =>
      roots
        .map((root) => toDisplayNode(root, dictionary, filter))
        .filter((node): node is DisplayNode => node !== null),
    [roots, dictionary, filter],
  );
  const firstPartUri = roots[0]?.children[0]?.uri;
  const [expandedUris, setExpandedUris] = useState<Set<string>>(
    () => new Set(firstPartUri ? [firstPartUri] : []),
  );

  const toggle = (uri: string) =>
    setExpandedUris((current) => {
      const next = new Set(current);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });

  if (displayed.length === 0) {
    return (
      <Typography variant="body2" sx={{ p: 2, color: "text.secondary" }}>
        {formatMessage({ id: "rinf_no_matching_parameters" })}
      </Typography>
    );
  }

  const title = formatMessage({ id: DETAILS_KINDS[kind].titleId });
  const showSource = roots.length > 1;

  return (
    <>
      {displayed.map((root) => (
        <RootBlock
          key={root.node.uri}
          title={
            showSource && root.node.source
              ? formatMessage(
                  { id: "rinf_declared_by_im" },
                  { title, code: root.node.source },
                )
              : title
          }
          displayNode={root}
          isExpanded={(uri) =>
            filter.trim().length > 0 || expandedUris.has(uri)
          }
          onToggle={toggle}
        />
      ))}
    </>
  );
};
