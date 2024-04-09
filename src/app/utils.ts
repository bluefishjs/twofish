import { TreeNode } from "./configurationPanel/node";

// Utility functions for Twofish
export function getChildrenBBox(
  childNodeBBoxes: { x: number; y: number; width: number; height: number }[]
) {
  const x = Math.min(...childNodeBBoxes.map((b) => b.x));
  const y = Math.min(...childNodeBBoxes.map((b) => b.y));

  const x2 = Math.max(...childNodeBBoxes.map((b) => b.x + b.width));
  const y2 = Math.max(...childNodeBBoxes.map((b) => b.y + b.height));

  const childBBox = {
    x,
    y,
    width: x2 - x,
    height: y2 - y,
  };

  return childBBox;
}

export function getSelfOrOwnedBBox(node: TreeNode<any>) {
  return {
    x: node.data.bbox.x ?? node.data.owned.x,
    y: node.data.bbox.y ?? node.data.owned.y,
    width: node.data.bbox.width ?? node.data.owned.width,
    height: node.data.bbox.height ?? node.data.owned.height,
  };
}
// Check if string is numeric
export function isNumeric(val: string): boolean {
  return (
    !isNaN(Number(Number.parseFloat(String(val)))) && isFinite(Number(val))
  );
}

export function symmetricDifference(a: Set<any>, b: Set<any>): Set<any> {
  return new Set([
    ...Array.from(a.values()).filter((val) => !b.has(val)),
    ...Array.from(b.values()).filter((val) => !a.has(val)),
  ]);
}

export function roundToNearestHundredth(num: number): number {
  return Math.round(num * 100) / 100;
}
