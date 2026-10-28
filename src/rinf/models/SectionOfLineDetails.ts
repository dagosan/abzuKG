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

export type {
  DetailsNode,
  ParameterStatus,
  ParameterValue,
  RawParameter,
} from "./detailsStatements";

/**
 * Builds the SoL → tracks → linked objects tree from the details query rows.
 * Returns null when no SoL matched (unknown id, or no version valid on the date).
 */
export const toSectionOfLineDetails = (
  bindings: SparqlBinding[],
): DetailsNode | null => {
  const nodes = new Map<string, DetailsNode>();
  // Linked objects can be shared: one pantograph rule or detection system
  // may serve several tracks, so a child can have several parents.
  const parentsOf = new Map<string, Set<string>>();
  let rootUri: string | null = null;

  bindings.forEach(({ subject, parent, level }) => {
    if (!subject?.value) return;
    if (!nodes.has(subject.value)) {
      nodes.set(subject.value, newNode(subject.value));
    }
    if (level?.value === "0") rootUri = subject.value;
    if (parent?.value && level?.value !== "0") {
      const parents = parentsOf.get(subject.value) ?? new Set<string>();
      parents.add(parent.value);
      parentsOf.set(subject.value, parents);
    }
  });
  if (!rootUri) return null;

  const childUris = new Set(parentsOf.keys());
  bindings.forEach((binding) => {
    const node = binding.subject?.value && nodes.get(binding.subject.value);
    if (node && binding.p?.value) applyStatement(node, binding, childUris);
  });
  parentsOf.forEach((parentUris, childUri) => {
    const childNode = nodes.get(childUri);
    parentUris.forEach((parentUri) => {
      const parentNode = nodes.get(parentUri);
      if (parentNode && childNode) parentNode.children.push(childNode);
    });
  });
  nodes.forEach((node) =>
    node.children.sort((first, second) =>
      `${first.classLabel} ${first.label}`.localeCompare(
        `${second.classLabel} ${second.label}`,
        "en",
        { numeric: true },
      ),
    ),
  );
  return nodes.get(rootUri) ?? null;
};
