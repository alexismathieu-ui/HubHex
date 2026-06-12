import type { ProjectFileListItem } from "../../types/depot";
import { idsMatch } from "./fileTreeUtils";

export const SCHEMA_NODE_W = 148;
export const SCHEMA_NODE_H = 80;
export const SCHEMA_COL_GAP = 228;
export const SCHEMA_ROW_GAP = 22;
export const SCHEMA_ROOT_BOX_W = 108;
export const SCHEMA_ROOT_BOX_H = 88;
export const SCHEMA_ROOT_LEFT = 12;
export const SCHEMA_ROOT_RIGHT = SCHEMA_ROOT_LEFT + SCHEMA_ROOT_BOX_W;
export const SCHEMA_ROOT_HUB_X = SCHEMA_ROOT_RIGHT + 12;

export interface TreeLayoutNode {
  node: ProjectFileListItem;
  depth: number;
  x: number;
  y: number;
}

export interface TreeConnector {
  parentId: number;
  childId: number;
  depth: number;
  parentX: number;
  parentY: number;
  childX: number;
  childY: number;
}

const DEPTH_LINE_COLORS = [
  "#06b6d4",
  "#8b5cf6",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
] as const;

export function depthLineColor(depth: number): string {
  return DEPTH_LINE_COLORS[depth % DEPTH_LINE_COLORS.length];
}

function layoutSubtree(
  node: ProjectFileListItem,
  depth: number,
  top: number,
  out: TreeLayoutNode[],
): number {
  const children = node.kind === "folder" ? (node.children ?? []) : [];
  const x = 130 + depth * SCHEMA_COL_GAP;

  if (children.length === 0) {
    out.push({ node, depth, x, y: top });
    return top + SCHEMA_NODE_H + SCHEMA_ROW_GAP;
  }

  let cursor = top;
  const childCenters: number[] = [];

  for (const child of children) {
    cursor = layoutSubtree(child, depth + 1, cursor, out);
    const laid = out.find((entry) => entry.node.id === child.id);
    if (laid) {
      childCenters.push(laid.y + SCHEMA_NODE_H / 2);
    }
  }

  const parentY =
    childCenters.length > 0
      ? (childCenters[0] + childCenters[childCenters.length - 1]) / 2 - SCHEMA_NODE_H / 2
      : top;

  out.push({ node, depth, x, y: parentY });
  return cursor;
}

export function layoutHorizontalForest(roots: ProjectFileListItem[]): TreeLayoutNode[] {
  const all: TreeLayoutNode[] = [];
  let forestTop = 48;

  for (const root of roots) {
    forestTop = layoutSubtree(root, 0, forestTop, all);
    forestTop += 36;
  }

  return all;
}

export function buildTreeConnectors(layout: TreeLayoutNode[]): TreeConnector[] {
  const byId = new Map(layout.map((entry) => [entry.node.id, entry]));
  const connectors: TreeConnector[] = [];

  for (const entry of layout) {
    const children = entry.node.kind === "folder" ? entry.node.children ?? [] : [];
    for (const child of children) {
      const childLayout = byId.get(child.id);
      if (!childLayout) {
        continue;
      }
      connectors.push({
        parentId: entry.node.id,
        childId: child.id,
        depth: entry.depth,
        parentX: entry.x + SCHEMA_NODE_W,
        parentY: entry.y + SCHEMA_NODE_H / 2,
        childX: childLayout.x,
        childY: childLayout.y + SCHEMA_NODE_H / 2,
      });
    }
  }

  return connectors;
}

export function getSchemaCanvasSize(layout: TreeLayoutNode[]): { width: number; height: number } {
  if (!layout.length) {
    return { width: 720, height: 420 };
  }

  const maxX = Math.max(...layout.map((entry) => entry.x));
  const maxY = Math.max(...layout.map((entry) => entry.y));
  return {
    width: maxX + SCHEMA_NODE_W + 120,
    height: maxY + SCHEMA_NODE_H + 80,
  };
}

export function isDescendantInTree(
  nodes: ProjectFileListItem[],
  ancestorId: number,
  candidateId: number,
): boolean {
  const ancestor = findInForest(nodes, ancestorId);
  if (!ancestor || ancestor.kind !== "folder") {
    return false;
  }
  return containsId(ancestor.children ?? [], candidateId);
}

function findInForest(nodes: ProjectFileListItem[], id: number): ProjectFileListItem | null {
  for (const node of nodes) {
    if (idsMatch(node.id, id)) {
      return node;
    }
    if (node.children?.length) {
      const found = findInForest(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function containsId(nodes: ProjectFileListItem[], id: number): boolean {
  for (const node of nodes) {
    if (idsMatch(node.id, id)) {
      return true;
    }
    if (node.kind === "folder" && node.children?.length && containsId(node.children, id)) {
      return true;
    }
  }
  return false;
}

export function getForestVerticalMidY(layout: TreeLayoutNode[]): number {
  if (!layout.length) {
    return 80;
  }
  const centers = layout.map((entry) => entry.y + SCHEMA_NODE_H / 2);
  return (Math.min(...centers) + Math.max(...centers)) / 2;
}

export function getRootNodesVerticalMidY(rootNodes: TreeLayoutNode[]): number {
  if (!rootNodes.length) {
    return 80;
  }
  const centers = rootNodes.map((entry) => entry.y + SCHEMA_NODE_H / 2);
  return (Math.min(...centers) + Math.max(...centers)) / 2;
}

export function connectorPath(connector: TreeConnector, hubOffset = 32): string {
  const hubX = connector.parentX + hubOffset;
  const { parentY, childY, childX } = connector;
  return [
    `M ${connector.parentX} ${parentY}`,
    `L ${hubX} ${parentY}`,
    `M ${hubX} ${Math.min(parentY, childY)}`,
    `L ${hubX} ${Math.max(parentY, childY)}`,
    `M ${hubX} ${childY}`,
    `L ${childX} ${childY}`,
  ].join(" ");
}
