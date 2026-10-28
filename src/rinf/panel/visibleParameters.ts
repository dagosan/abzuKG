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

import { localName } from "../models/labels";
import {
  compareByRinfIndex,
  defineTerm,
  ParameterDictionary,
  TermDefinition,
} from "../models/ParameterDictionary";
import type {
  DetailsNode,
  ParameterStatus,
  ParameterValue,
} from "../models/detailsTree";

/** A parameter ready to display: named, indexed and with its unit. */
export interface DisplayParameter extends TermDefinition {
  propertyUri: string;
  status: ParameterStatus;
  values: ParameterValue[];
}

/** A node with only the parameters and children that survive the filter. */
export interface DisplayNode {
  node: DetailsNode;
  title: string;
  parameters: DisplayParameter[];
  children: DisplayNode[];
}

const normalise = (text: string): string => text.trim().toLocaleLowerCase();

const matches = (parameter: DisplayParameter, filter: string): boolean =>
  [
    parameter.label,
    parameter.rinfIndex ?? "",
    ...parameter.values.map((v) => v.text),
  ].some((text) => normalise(text).includes(filter));

/** "Contact Line System · Overhead contact line (OCL)", or just the label. */
export const nodeTitle = ({ classLabel, label, uri }: DetailsNode): string => {
  if (!classLabel) return label || localName(uri);
  if (!label || label === classLabel) return classLabel;
  return `${classLabel} · ${label}`;
};

/**
 * Names, orders (by RINF index) and filters a node's parameters, recursively.
 * With a filter, a node is kept only if one of its parameters or children
 * matches; without one, everything is kept. Returns null when nothing is left.
 */
export const toDisplayNode = (
  node: DetailsNode,
  dictionary: ParameterDictionary,
  filter: string,
): DisplayNode | null => {
  const wanted = normalise(filter);
  const parameters = node.parameters
    .map((parameter) => ({
      ...defineTerm(dictionary, parameter.propertyUri),
      ...parameter,
    }))
    .filter((parameter) => !wanted || matches(parameter, wanted))
    .sort(compareByRinfIndex);
  const children = node.children
    .map((child) => toDisplayNode(child, dictionary, filter))
    .filter((child): child is DisplayNode => child !== null);

  if (wanted && parameters.length === 0 && children.length === 0) return null;
  return { node, title: nodeTitle(node), parameters, children };
};
