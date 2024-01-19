import _ from "lodash";
// returns axis to align on (either x value or y value) if able to be aligned
// returns false otherwise
export const getAlignAxes = (selectedNodes: any[], operation: string, alignX?: number, alignY?: number) => {
    // let alignX: number | undefined;
    // let alignY: number | undefined;
    let minX: number | undefined;
    let maxX: number | undefined;
    let minY: number | undefined;
    let maxY: number | undefined;

    const fixedNodes = selectedNodes
        .filter((node) => {
            if (
                operation === "left" ||
                operation === "center-horizontal" ||
                operation === "right"
            )
                return node.data.bbox.x === undefined;
            return node.data.bbox.y === undefined;
        })
        .map((node) => ({
            bbox: node.data.bbox,
            owned: node.data.owned,
        })); // nodes that are already fixed in the relevant axis

    for (const { bbox, owned } of fixedNodes) {
        if (
            operation === "left" ||
            operation === "center-horizontal" ||
            operation === "right"
        ) {
            switch (operation) {
                case "left":
                    if (alignX !== undefined && owned.x !== alignX) return false;
                    alignX = owned.x;
                    break;
                case "center-horizontal":
                    if (alignX !== undefined && owned.x + bbox.width / 2 !== alignX)
                        return false;
                    alignX = owned.x + bbox.width / 2;
                    break;
                case "right":
                    if (alignX !== undefined && owned.x + bbox.width !== alignX)
                        return false;
                    alignX = owned.x + bbox.width;
                    break;
            }
        } else {
            switch (operation) {
                case "top":
                    if (alignY !== undefined && owned.y !== alignY) return false;
                    alignY = owned.y;
                    break;
                case "center-vertical":
                    if (alignY !== undefined && owned.y + bbox.height / 2 !== alignY)
                        return false;
                    alignY = owned.y + bbox.height / 2;
                    break;
                case "bottom":
                    if (alignY !== undefined && owned.y + bbox.height !== alignY)
                        return false;
                    alignY = owned.y + bbox.height;
                    break;
            }
        }
    }

    if (fixedNodes.length !== 0) return { alignX, alignY };

    selectedNodes.forEach((node) => {
        const bbox = node.data.bbox;
        if (
            operation === "left" ||
            operation === "center-horizontal" ||
            operation === "right"
        ) {
            switch (operation) {
                case "left":
                    alignX = alignX === undefined ? bbox.x : Math.min(alignX, bbox.x);
                    break;
                case "center-horizontal":
                    minX = Math.min(bbox.x, minX ?? bbox.x);
                    maxX = Math.max(bbox.x + (bbox.width ?? 0), maxX ?? 0);
                    alignX = (minX + maxX) / 2;
                    break;
                case "right":
                    alignX = alignX === undefined ? bbox.x : Math.max(alignX, bbox.x);
                    break;
            }
        } else {
            switch (operation) {
                case "top":
                    alignY = alignY === undefined ? bbox.y : Math.min(alignY, bbox.y);
                    break;
                case "center-vertical":
                    minY = Math.min(bbox.y, minY ?? bbox.y);
                    maxY = Math.max(bbox.y + (bbox.height ?? 0), maxY ?? 0);
                    alignY = (minY + maxY) / 2;
                    break;
                case "bottom":
                    alignY = alignY === undefined ? bbox.y : Math.max(alignY, bbox.y);
                    break;
            }
        }
    });
    return { alignX, alignY };
};


// Given selected nodes, if the stack layout operation can be completed, 
// returns a new array corresponding to the new positions of the nodes;
// otherwise, returns false.
// 
// Can optionally defined spacing; if not, tries to space based on distance between objects
//
// Tries to center align on the secondary axis, but if that doesn't work, for now
// just maintains current locations of nodes
export const getStackLayout = (selectedNodes: any[], operation: string, uid: string, spacing?: number, sorted?: boolean) => {
    // TODO: make this loop through all other alignment values
    const alignment =
        operation === "vertical" ? "center-horizontal" : "center-vertical";
    const alignAxes = getAlignAxes(selectedNodes, alignment);
    if (alignAxes !== false) {
        // can be aligned
        const { alignX, alignY } = alignAxes;
        if (alignment === "center-horizontal") {
            selectedNodes = selectedNodes.map((node) => {
                const updateOwner = node.data.bbox.x !== undefined;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        bbox: { ...node.data.bbox, x: undefined },
                        owned: {
                            ...node.data.owned,
                            x: (alignX ?? 0) - node.data.bbox.width / 2,
                            xOwner: updateOwner ? uid : node.data.xOwner
                        },
                    },
                }
            });
        } else if (alignment === "center-vertical") {
            selectedNodes = selectedNodes.map((node) => {
                const updateOwner = node.data.bbox.y !== undefined;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        bbox: { ...node.data.bbox, y: undefined },
                        owned: {
                            ...node.data.owned,
                            y: (alignY ?? 0) - node.data.bbox.height / 2,
                            yOwner: updateOwner ? uid : node.data.yOwner
                        },
                    },
                }
            });
        }
    }

    let sortedNodes;
    if (!sorted) { // either sorted not defined or is false 
        sortedNodes = selectedNodes
            .sort((a, b) => {
                if (operation === "horizontal") {
                    const a_x = a.data.bbox.x ?? a.data.owned.x;
                    const b_x = b.data.bbox.x ?? b.data.owned.x;
                    return a_x < b_x ? -1 : a_x > b_x ? 1 : 0;
                }
                const a_y = a.data.bbox.y ?? a.data.owned.y;
                const b_y = a.data.bbox.y ?? a.data.owned.y;
                return a_y < b_y ? -1 : a_y > b_y ? 1 : 0;
            })
            .map((node, i) => ({ index: i, node: { ...node } }));
    }
    else {
        sortedNodes = selectedNodes.map((node, i) => ({ index: i, node: { ...node } }));
    }


    // nodes that have computed values already
    const axisPlacedNodes = sortedNodes
        .filter(({ node }) => {
            if (operation === "vertical")
                return node.data.bbox.y === undefined;
            return node.data.bbox.x === undefined;
        })
        .map(({ index, node }) => ({
            index: index,
            bbox: node.data.bbox,
            owned: node.data.owned,
        }));

    const updatedPositions: any[] = [];
    let calculatedSpacing;
    if (operation === "horizontal") {
        // calculate default spacing based on first and last node spacing
        const lastNode = sortedNodes[sortedNodes.length - 1].node.data;
        const firstNode = sortedNodes[0].node.data;

        calculatedSpacing =
            spacing ?? ((lastNode.bbox.x ?? lastNode.owned.x) -
                _.sumBy(
                    sortedNodes.slice(0, -1),
                    (item) => item.node.data.bbox.width
                ) -
                (firstNode.bbox.x ?? firstNode.owned.x)) /
            sortedNodes.length;

        // TODO: finish debugging spacing -- it's not entirely working
        let startingX = sortedNodes[0].node.data.bbox.x;
        if (axisPlacedNodes.length === 1) {
            const fixedIndex = axisPlacedNodes[0].index;
            startingX =
                axisPlacedNodes[0].owned.x -
                calculatedSpacing * fixedIndex -
                _.sumBy(
                    sortedNodes.slice(0, fixedIndex),
                    (item) => item.node.data.bbox.width
                );
        } else if (axisPlacedNodes.length > 1) {
            const widthBetween = _.sumBy(
                sortedNodes.slice(
                    axisPlacedNodes[0].index + 1,
                    axisPlacedNodes[1].index
                ),
                (item) => item.node.data.bbox.width
            );
            calculatedSpacing =
                (axisPlacedNodes[1].owned.x -
                    (axisPlacedNodes[0].owned.x + axisPlacedNodes[0].bbox.width) -
                    widthBetween) /
                (axisPlacedNodes[1].index - axisPlacedNodes[0].index);
            // TODO: Check for rest of the nodes being satisfied as well + update starting X
        }
        let x = startingX;
        for (const { node } of sortedNodes) {
            updatedPositions.push({
                id: node.id,
                type: "geo",
                x: x,
                y: node.data.owned.y,
            });
            // update node positioning
            if (node.data.bbox.x !== undefined) {
                node.data.owned.xOwner = uid;
            }
            node.data.owned.x = x;
            node.data.bbox.x = undefined;

            // update x
            x += node.data.bbox.width + calculatedSpacing;
        }
    } else {
        // calculate default spacing based on first and last node spacing
        const lastNode = sortedNodes[sortedNodes.length - 1].node.data;
        const firstNode = sortedNodes[0].node.data;
        calculatedSpacing =
            spacing ?? ((lastNode.bbox.y ?? lastNode.owned.y) -
                _.sumBy(
                    sortedNodes.slice(0, -1),
                    (item) => item.node.data.bbox.height
                ) -
                (firstNode.bbox.y ?? firstNode.owned.y)) /
            sortedNodes.length;

        let startingY = sortedNodes[0].node.data.bbox.y;
        if (axisPlacedNodes.length === 1) {
            const fixedIndex = axisPlacedNodes[0].index;
            startingY =
                axisPlacedNodes[0].owned.y -
                calculatedSpacing * fixedIndex -
                _.sumBy(
                    sortedNodes.slice(0, fixedIndex),
                    (item) => item.node.data.bbox.height
                );
        } else if (axisPlacedNodes.length > 1) {
            const heightBetween = _.sumBy(
                sortedNodes.slice(
                    axisPlacedNodes[0].index,
                    axisPlacedNodes[1].index
                ),
                (item) => item.node.data.bbox.height
            );
            spacing =
                (axisPlacedNodes[1].owned.y - axisPlacedNodes[0].owned.y -
                    heightBetween) /
                (axisPlacedNodes[1].index - axisPlacedNodes[0].index);
            // TODO: Check for rest of the nodes being satisfied as well + calculate new starting Y & update shapes
        }
        let y = startingY;
        for (const { node } of sortedNodes) {
            updatedPositions.push({
                id: node.id,
                type: "geo",
                x: node.data.owned.x,
                y: y,
            });
            // update node positioning
            if (node.data.bbox.y !== undefined) {
                node.data.owned.yOwner = uid;
            }
            node.data.owned.y = y;
            node.data.bbox.y = undefined;

            // update y
            y += node.data.bbox.height + calculatedSpacing;
        }
    }
    return { stackable: true, updatedPositions: updatedPositions, sortedNodes: sortedNodes, spacing: calculatedSpacing, alignment: alignment };
}