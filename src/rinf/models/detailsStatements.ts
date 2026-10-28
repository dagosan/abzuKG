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

import { ERA_NAMESPACE } from "../api/queryParts";
import type { SparqlBinding } from "../api/sparqlClient";
import { localName, stripValidity } from "./labels";

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const NOT_APPLICABLE = `${ERA_NAMESPACE}notApplicable`;
const NOT_YET_AVAILABLE = `${ERA_NAMESPACE}notYetAvailable`;
const GENERIC_CLASS = `${ERA_NAMESPACE}InfrastructureElement`;
/** Statements that tie resources together rather than describe them. */
const STRUCTURAL = new Set(
  ["hasPart", "isPartOf", "canonicalURI", "netReference"].map(
    (name) => `${ERA_NAMESPACE}${name}`,
  ),
);

export type ParameterStatus = "value" | "notApplicable" | "notYetAvailable";

export interface ParameterValue {
  /** Literal text, or the label of a linked value (a code list entry, an OP, …). */
  text: string;
  uri: string | null;
  datatype: string | null;
}

export interface RawParameter {
  propertyUri: string;
  status: ParameterStatus;
  values: ParameterValue[];
}

/** A SoL, a track, or an object a track links to (tunnel, ETCS, …). */
export interface DetailsNode {
  uri: string;
  label: string;
  classUri: string | null;
  classLabel: string | null;
  parameters: RawParameter[];
  children: DetailsNode[];
}

/** Label is empty until the data gives one; the panel then titles the node by its class. */
export const newNode = (uri: string): DetailsNode => ({
  uri,
  label: "",
  classUri: null,
  classLabel: null,
  parameters: [],
  children: [],
});

const addValue = (
  node: DetailsNode,
  propertyUri: string,
  status: ParameterStatus,
  value: ParameterValue | null,
) => {
  let parameter = node.parameters.find(
    (existing) => existing.propertyUri === propertyUri,
  );
  if (!parameter) {
    parameter = { propertyUri, status, values: [] };
    node.parameters.push(parameter);
  }
  // A shared object arrives once per track that links to it: keep one copy.
  const duplicate = parameter.values.some(
    (existing) => existing.text === value?.text && existing.uri === value?.uri,
  );
  if (value && !duplicate) parameter.values.push(value);
};

const toValue = (binding: SparqlBinding): ParameterValue => {
  const { o, oLabel } = binding;
  const isIri = o?.type === "uri";
  const label = oLabel?.value ? stripValidity(oLabel.value) : "";
  return {
    text: isIri ? label || localName(o!.value) : (o?.value ?? ""),
    uri: isIri ? o!.value : null,
    datatype: o?.datatype ?? null,
  };
};

export const applyStatement = (
  node: DetailsNode,
  binding: SparqlBinding,
  childUris: Set<string>,
) => {
  const property = binding.p!.value;
  const object = binding.o?.value ?? "";
  if (property === RDFS_LABEL) {
    node.label = stripValidity(object);
  } else if (property === RDF_TYPE) {
    if (!object.startsWith(ERA_NAMESPACE) || object === GENERIC_CLASS) return;
    node.classUri ??= object;
    node.classLabel ??= binding.oLabel?.value ?? null;
  } else if (property === NOT_APPLICABLE) {
    addValue(node, object, "notApplicable", null);
  } else if (property === NOT_YET_AVAILABLE) {
    addValue(node, object, "notYetAvailable", null);
  } else if (!STRUCTURAL.has(property) && !childUris.has(object)) {
    addValue(node, property, "value", toValue(binding));
  }
};
