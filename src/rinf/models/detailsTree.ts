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

import type { SparqlBinding } from "../api/sparqlClient";
import { applyStatement, DetailsNode, newNode } from "./detailsStatements";
import { localName } from "./labels";
import { positionFromBinding } from "./rootPosition";

export type {
  DetailsNode,
  ParameterStatus,
  ParameterValue,
  RawParameter,
} from "./detailsStatements";

const ROOT_LEVEL = "0";

const byClassThenLabel = (first: DetailsNode, second: DetailsNode): number =>
  `${first.classLabel} ${first.label}`.localeCompare(
    `${second.classLabel} ${second.label}`,
    "en",
    { numeric: true },
  );

/**
 * Builds element → parts → linked objects trees from the details query rows.
 * Usually one root; a border point declared by two IMs gives two. An empty
 * list means nothing matched (unknown id, or no version valid on the date).
 */
export const toDetailsTrees = (
  bindings: SparqlBinding[],
  hiddenProperties: string[] = [],
): DetailsNode[] => {
  const nodes = new Map<string, DetailsNode>();
  // Linked objects can be shared: one pantograph rule or detection system
  // may serve several tracks, so a child can have several parents.
  const parentsOf = new Map<string, Set<string>>();
  const rootUris = new Set<string>();

  bindings.forEach((binding) => {
    const { subject, parent, level, source } = binding;
    if (!subject?.value) return;
    if (!nodes.has(subject.value)) {
      nodes.set(subject.value, newNode(subject.value));
    }
    if (level?.value === ROOT_LEVEL) {
      const root = nodes.get(subject.value)!;
      rootUris.add(subject.value);
      root.source ??= source?.value ? localName(source.value) : null;
      root.position ??= positionFromBinding(binding);
      return;
    }
    if (parent?.value) {
      const parents = parentsOf.get(subject.value) ?? new Set<string>();
      parents.add(parent.value);
      parentsOf.set(subject.value, parents);
    }
  });
  if (rootUris.size === 0) return [];

  const childUris = new Set(parentsOf.keys());
  const hidden = new Set(hiddenProperties);
  bindings.forEach((binding) => {
    const node = binding.subject?.value && nodes.get(binding.subject.value);
    if (node && binding.p?.value) {
      applyStatement(node, binding, childUris, hidden);
    }
  });
  parentsOf.forEach((parentUris, childUri) => {
    const childNode = nodes.get(childUri);
    parentUris.forEach((parentUri) => {
      const parentNode = nodes.get(parentUri);
      if (parentNode && childNode) parentNode.children.push(childNode);
    });
  });
  nodes.forEach((node) => node.children.sort(byClassThenLabel));

  return Array.from(rootUris)
    .map((uri) => nodes.get(uri)!)
    .sort((first, second) =>
      (first.source ?? "").localeCompare(second.source ?? ""),
    );
};
