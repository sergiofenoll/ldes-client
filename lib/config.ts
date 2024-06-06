import { NamedNode, Quad } from "@rdfjs/types";
import { Condition, empty_condition as emptyCondition } from "./condition";

export interface ShapeConfig {
  quads: Quad[];
  shapeId: NamedNode;
}

export interface Config {
  loose: boolean;
  polling: boolean;
  url: string;
  urlIsView: boolean;
  noShape: boolean;
  stateFile?: string;
  pollInterval: number;
  condition: Condition;
  shape?: ShapeConfig;
  shapeFile?: string;
  onlyDefaultGraph?: boolean;
  fetch?: typeof fetch;
}

export interface WithTarget {
  target: Object;
}

const defaultConfig: Config = {
  urlIsView: false,
  noShape: false,
  condition: emptyCondition(),
  loose: false,
  polling: false,
  url: "",
  pollInterval: 200,
};

const defaultTarget: WithTarget = {
  target: {},
};

export async function getConfig(): Promise<Config & WithTarget> {
  return Object.assign({}, defaultConfig, defaultTarget);
}

export function intoConfig(config: Partial<Config>): Config {
  return Object.assign({}, defaultConfig, defaultTarget, config);
}
