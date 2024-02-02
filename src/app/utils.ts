// Utility functions for Twofish
export function getBBox(
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

// Check if string is numeric
export function isNumeric(val: string): boolean {
    return (
      !isNaN(Number(Number.parseFloat(String(val)))) &&
      isFinite(Number(val))
    );
  }