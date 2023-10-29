// Utility functions for Twofish
export function getBBox(
    childNodeBBoxes: { x: number; y: number; width: number; height: number }[]
) {
    console.log(childNodeBBoxes);

    const x = Math.min(...childNodeBBoxes.map((b) => b.x));
    const y = Math.min(...childNodeBBoxes.map((b) => b.y));

    const x2 = Math.max(...childNodeBBoxes.map((b) => b.x + b.width));
    const y2 = Math.max(...childNodeBBoxes.map((b) => b.y + b.height));

    console.log({
        x,
        y,
        x2,
        y2,
        width: x2 - x,
        height: y2 - y,
    });

    const childBBox = {
        x,
        y,
        width: x2 - x,
        height: y2 - y,
    };

    return childBBox;
}