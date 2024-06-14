import { Quad, Term } from "@rdfjs/types";
import { RDF, TREE } from "@treecg/types";
import { CBDShapeExtractor } from "extract-cbd-shape";
import { State } from "./state";
import { RdfStore } from "rdf-stores";
import { getObjects, memberFromQuads } from "./utils";

import { Condition } from "./condition";
import { NamedNode } from "n3";
import { RelationCondition } from "./condition/range";

export interface Member {
  id: Term;
  quads: Quad[];
  timestamp?: string | Date;
  isVersionOf?: string;
  type?: Term;
}

export interface Relation {
  id?: Term;
  source: string;
  node: string;
  type: Term;
  value?: Term[];
  path?: Term;
}

export interface Page {
  relations: Relation[];
  node: string;
}

export function extractMembers(
  store: RdfStore,
  stream: Term,
  extractor: CBDShapeExtractor,
  state: State,
  cb: (member: Member) => void,
  shapeId?: Term,
  timestampPath?: Term,
  isVersionOfPath?: Term,
): Promise<void>[] {
  const members = getObjects(store, stream, TREE.terms.member, null);
  async function extractMember(member: Term) {
    const quads = await extractor.extract(store, member, shapeId);
    cb(memberFromQuads(member, quads, timestampPath, isVersionOfPath));
  }

  const out: Promise<void>[] = [];
  for (let member of members) {
    if (!state.seen(member.value)) {
      state.add(member.value);
      out.push(extractMember(member));
    }
  }

  return out;
}

export function extractRelations(
  store: RdfStore,
  node: Term,
  loose: boolean,
  condition: Condition,
): Relation[] {
  const relationIds = loose
    ? getObjects(store, null, TREE.terms.relation, null)
    : getObjects(store, node, TREE.terms.relation, null);

  const source = node.value;

  const conditions = new Map<
    string,
    { cond: RelationCondition; relation: Relation }
  >();
  // Set of tree:Nodes that are to be skipped based on temporal constraints.
  // Necessary when there is more than one relation type pointing towards the same node
  const filteredNodes = new Set<string>();
  const allowedNodes = new Map<string, Relation>();

  for (let relationId of relationIds) {
    const node = getObjects(store, relationId, TREE.terms.node, null)[0];

    if (!conditions.get(node.value)) {
      const node = getObjects(store, relationId, TREE.terms.node, null)[0];
      const ty =
        getObjects(store, relationId, RDF.terms.type, null)[0] || TREE.Relation;
      const path = getObjects(store, relationId, TREE.terms.path, null)[0];
      const value = getObjects(store, relationId, TREE.terms.value, null);
      const relation = {
        source,
        node: node.value,
        type: ty,
        path,
        value,
        id: relationId,
      };
      conditions.set(node.value, {
        cond: new RelationCondition(store),
        relation,
      });
    }

    conditions.get(node.value)!.cond.addRelation(relationId);
  }

  const allowed = [];
  for (let cond of conditions.values()) {
    if (cond.cond.allowed(condition)) {
      allowed.push(cond.relation);
    }
  }

  console.log("allowed", allowed.map(x => x.node))
  return allowed;
}
