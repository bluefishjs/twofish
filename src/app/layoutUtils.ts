import { TLShapeId } from "@tldraw/tldraw";
import _ from "lodash";
import { Component } from "./configurationPanel/node";
import { getChildrenBBox } from "./utils";
import { Alignment } from "./configurationPanel/alignPanel";

export const horizontalAlignments = ["left", "center-horizontal", "right"];
// returns axis to align on (either x value or y value) if able to be aligned
// returns false otherwise
export const getAlignAxes = (
  selectedNodeData: any[],
  operation: string,
  alignX?: number,
  alignY?: number
) => {
  // let alignX: number | undefined;
  // let alignY: number | undefined;
  let minX: number | undefined;
  let maxX: number | undefined;
  let minY: number | undefined;
  let maxY: number | undefined;

  const fixedNodes = selectedNodeData
    .filter((data) => {
      if (horizontalAlignments.includes(operation))
        return data.bbox.x === undefined;
      return data.bbox.y === undefined;
    })
    .map((data) => ({
      bbox: data.bbox,
      owned: data.owned,
    })); // nodes that are already fixed in the relevant axis

  for (const { bbox, owned } of fixedNodes) {
    if (horizontalAlignments.includes(operation)) {
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
  if (alignX !== undefined && horizontalAlignments.includes(operation))
    return { alignX, alignY };
  if (alignY != undefined && !horizontalAlignments.includes(operation))
    return { alignX, alignY };

  selectedNodeData.forEach((data) => {
    const bbox = data.bbox;
    if (horizontalAlignments.includes(operation)) {
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
          alignX =
            alignX === undefined
              ? bbox.x + bbox.width
              : Math.max(alignX, bbox.x + bbox.width);
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
          alignY =
            alignY === undefined
              ? bbox.y + bbox.height
              : Math.max(alignY, bbox.y + bbox.height);
          break;
      }
    }
  });
  return { alignX, alignY };
};

export const getAlignLayout = (
  childrenData: any[],
  operation: string,
  uid: string,
  alignX?: number,
  alignY?: number
) => {
  let modifiedData: any[];
  // try to give alignment information back if children have already been aligned with this uid
  if (horizontalAlignments.includes(operation)) {
    modifiedData = childrenData.map((childData: any) => {
      return {
        ...childData,
        bbox: {
          ...childData.bbox,
          x:
            childData.owned.xOwner === uid
              ? childData.owned.x
              : childData.bbox.x,
        },
        owned: {
          ...childData.owned,
          x: childData.owned.xOwner === uid ? undefined : childData.owned.x,
          xOwner:
            childData.owned.xOwner === uid ? undefined : childData.owned.xOwner,
        },
      };
    });
  } else {
    modifiedData = childrenData.map((childData: any) => ({
      ...childData,
      bbox: {
        ...childData.bbox,
        y:
          childData.owned.yOwner === uid ? childData.owned.y : childData.bbox.y,
      },
      owned: {
        ...childData.owned,
        y: childData.owned.yOwner === uid ? undefined : childData.owned.y,
        yOwner:
          childData.owned.yOwner === uid ? undefined : childData.owned.yOwner,
      },
    }));
  }

  const res = getAlignAxes(modifiedData, operation, alignX, alignY);
  if (res === false) {
    return { canPerformOperation: false };
  }
  const calculatedAlignX = res.alignX;
  const calculatedAlignY = res.alignY;

  const updatedPositions: {
    id: TLShapeId;
    type: string;
    x?: number;
    y?: number;
  }[] = [];

  const updatedNodeData = modifiedData.map((data) => {
    const updatedData = { ...data };
    if (horizontalAlignments.includes(operation)) {
      if (updatedData.owned.x !== undefined) {
        return updatedData;
      }
      updatedData.bbox.x = undefined;
      updatedData.owned.xOwner = uid;
      switch (operation) {
        case "left":
          updatedData.owned.x = calculatedAlignX ?? 0;
          break;
        case "center-horizontal":
          updatedData.owned.x = (calculatedAlignX ?? 0) - data.bbox.width / 2;
          break;
        case "right":
          updatedData.owned.x = (calculatedAlignX ?? 0) - data.bbox.width;
          break;
      }
      updatedPositions.push({
        id: data.id,
        type: "geo",
        x: updatedData.owned.x,
      });
    } else {
      if (updatedData.owned.y !== undefined) {
        return updatedData;
      }
      updatedData.bbox.y = undefined;
      updatedData.owned.yOwner = uid;
      switch (operation) {
        case "top":
          updatedData.owned.y = calculatedAlignY ?? 0;
          break;
        case "center-vertical":
          updatedData.owned.y = (calculatedAlignY ?? 0) - data.bbox.height / 2;
          break;
        case "bottom":
          updatedData.owned.y = (calculatedAlignY ?? 0) - data.bbox.height;
          break;
      }
      updatedPositions.push({
        id: data.id,
        type: "geo",
        y: updatedData.owned.y,
      });
    }

    return updatedData;
  });

  return {
    canPerformOperation: true,
    alignX: calculatedAlignX,
    alignY: calculatedAlignY,
    updatedPositions: updatedPositions,
    updatedNodeData: updatedNodeData,
  };
};

export const getBackgroundLayout = (
  childrenData: any,
  padding: number,
  uid: string
) => {
  const childrenBBoxes = childrenData.map((data) => ({
    x: data.bbox.x ?? data.owned.x ?? 0,
    y: data.bbox.y ?? data.owned.y ?? 0,
    width: data.bbox.width ?? data.owned.width ?? 0,
    height: data.bbox.height ?? data.owned.height ?? 0,
  }));
  const newBBox = getChildrenBBox(childrenBBoxes);
  const backgroundBBox = {
    x: newBBox.x - padding,
    y: newBBox.y - padding,
    width: newBBox.width + padding * 2,
    height: newBBox.height + padding * 2,
  };
  return {
    backgroundBBox: backgroundBBox,
    backgroundPosition: {
      id: uid,
      x: backgroundBBox.x,
      y: backgroundBBox.y,
      props: {
        w: backgroundBBox.width,
        h: backgroundBBox.height,
      },
    },
  };
};

export const getDistributeLayout = (
  childrenData: any[],
  operation: string,
  uid: string,
  spacing?: number,
  sorted?: boolean
) => {
  let modifiedData;
  if (operation === "horizontal") {
    modifiedData = childrenData.map((childData: any) => {
      return {
        ...childData,
        bbox: {
          ...childData.bbox,
          x:
            childData.owned.xOwner === uid
              ? childData.owned.x
              : childData.bbox.x,
        },
        owned: {
          ...childData.owned,
          x: childData.owned.xOwner === uid ? undefined : childData.owned.x,
          xOwner:
            childData.owned.xOwner === uid ? undefined : childData.owned.xOwner,
        },
      };
    });
  } else {
    modifiedData = childrenData.map((childData: any) => ({
      ...childData,
      bbox: {
        ...childData.bbox,
        y:
          childData.owned.yOwner === uid ? childData.owned.y : childData.bbox.y,
      },
      owned: {
        ...childData.owned,
        y: childData.owned.yOwner === uid ? undefined : childData.owned.y,
        yOwner:
          childData.owned.yOwner === uid ? undefined : childData.owned.yOwner,
      },
    }));
  }

  if (!["horizontal", "vertical"].includes(operation)) {
    return { canPerformOperation: false, sortedNodes: modifiedData };
  }

  let sortedNodes;
  if (!sorted) {
    // either sorted not defined or is false
    sortedNodes = modifiedData
      .sort((a, b) => {
        if (operation === "horizontal") {
          const a_x = a.bbox.x ?? a.owned.x;
          const b_x = b.bbox.x ?? b.owned.x;
          return a_x < b_x ? -1 : a_x > b_x ? 1 : 0;
        }
        const a_y = a.bbox.y ?? a.owned.y;
        const b_y = b.bbox.y ?? b.owned.y;
        return a_y < b_y ? -1 : a_y > b_y ? 1 : 0;
      })
      .map((data, i) => ({ index: i, data: { ...data } }));
  } else {
    sortedNodes = modifiedData.map((data, i) => ({
      index: i,
      data: { ...data },
    }));
  }

  // nodes that have computed values already
  const axisPlacedNodes = sortedNodes
    .filter(({ data }) => {
      if (operation === "vertical") return data.bbox.y === undefined;
      return data.bbox.x === undefined;
    })
    .map(({ index, data }) => ({
      index: index,
      bbox: data.bbox,
      owned: data.owned,
    }));

  const updatedPositions: any[] = [];
  let calculatedSpacing;
  if (operation === "horizontal") {
    // calculate default spacing based on first and last node spacing
    const lastNode = sortedNodes[sortedNodes.length - 1].data;
    const firstNode = sortedNodes[0].data;

    calculatedSpacing =
      spacing ??
      ((lastNode.bbox.x ?? lastNode.owned.x) -
        _.sumBy(sortedNodes.slice(0, -1), (item) => item.data.bbox.width) -
        (firstNode.bbox.x ?? firstNode.owned.x)) /
        (sortedNodes.length - 1);

    let startingX = sortedNodes[0].data.bbox.x ?? sortedNodes[0].data.owned.x;
    if (axisPlacedNodes.length === 1) {
      const fixedIndex = axisPlacedNodes[0].index;
      startingX =
        axisPlacedNodes[0].owned.x -
        calculatedSpacing * fixedIndex -
        _.sumBy(
          sortedNodes.slice(0, fixedIndex),
          (item) => item.data.bbox.width
        );
    } else if (axisPlacedNodes.length > 1) {
      const calcWidthBetweenIndices = (
        sortedNodes: any[],
        prevIndex: number,
        nextIndex: number
      ) => {
        return _.sumBy(
          sortedNodes.slice(prevIndex + 1, nextIndex),
          (item) => item.data.bbox.width
        );
      };
      const widthBetween = calcWidthBetweenIndices(
        sortedNodes,
        axisPlacedNodes[0].index,
        axisPlacedNodes[1].index
      );
      calculatedSpacing =
        (axisPlacedNodes[1].owned.x -
          (axisPlacedNodes[0].owned.x + axisPlacedNodes[0].bbox.width) -
          widthBetween) /
        (axisPlacedNodes[1].index - axisPlacedNodes[0].index);

      startingX =
        axisPlacedNodes[0].owned.x -
        axisPlacedNodes[0].index * calculatedSpacing -
        _.sumBy(
          sortedNodes.slice(0, axisPlacedNodes[0].index),
          (item) => item.data.bbox.width
        );

      for (let ind = 2; ind < axisPlacedNodes.length; ind++) {
        const { index, owned } = axisPlacedNodes[ind];
        const {
          index: prevIndex,
          owned: prevOwned,
          bbox: prevBBox,
        } = axisPlacedNodes[ind - 1];
        const curWidthBetween = calcWidthBetweenIndices(
          sortedNodes,
          axisPlacedNodes[0].index,
          axisPlacedNodes[1].index
        );
        const curCalculatedSpacing =
          (owned.x - (prevOwned.x + prevBBox.width) - curWidthBetween) /
          (index - prevIndex);

        if (curCalculatedSpacing !== calculatedSpacing) {
          return { canPerformOperation: false, sortedNodes: modifiedData };
        }
      }
    }
    let x = startingX;
    for (const { data } of sortedNodes) {
      updatedPositions.push({
        id: data.id,
        type: "geo",
        x: x,
        y: data.owned.y,
      });
      // update node positioning
      if (data.bbox.x !== undefined) {
        data.owned.xOwner = uid;
      }
      data.owned.x = x;
      data.bbox.x = undefined;

      // update x
      x += data.bbox.width + calculatedSpacing;
    }
  } else {
    // calculate default spacing based on first and last node spacing
    const lastNode = sortedNodes[sortedNodes.length - 1].data;
    const firstNode = sortedNodes[0].data;
    calculatedSpacing =
      spacing ??
      ((lastNode.bbox.y ?? lastNode.owned.y) -
        _.sumBy(sortedNodes.slice(0, -1), (item) => item.data.bbox.height) -
        (firstNode.bbox.y ?? firstNode.owned.y)) /
        (sortedNodes.length - 1);

    let startingY = sortedNodes[0].data.bbox.y;
    if (axisPlacedNodes.length === 1) {
      const fixedIndex = axisPlacedNodes[0].index;
      startingY =
        axisPlacedNodes[0].owned.y -
        calculatedSpacing * fixedIndex -
        _.sumBy(
          sortedNodes.slice(0, fixedIndex),
          (item) => item.data.bbox.height
        );
    } else if (axisPlacedNodes.length > 1) {
      const calcHeightBetweenIndices = (
        sortedNodes: any[],
        prevIndex: number,
        nextIndex: number
      ) => {
        return _.sumBy(
          sortedNodes.slice(prevIndex, nextIndex),
          (item) => item.data.bbox.height
        );
      };
      const heightBetween = calcHeightBetweenIndices(
        sortedNodes,
        axisPlacedNodes[0].index,
        axisPlacedNodes[1].index
      );
      spacing =
        (axisPlacedNodes[1].owned.y -
          axisPlacedNodes[0].owned.y -
          heightBetween) /
        (axisPlacedNodes[1].index - axisPlacedNodes[0].index);
      // TODO: Check for rest of the nodes being satisfied as well + calculate new starting Y & update shapes
      for (let ind = 2; ind < axisPlacedNodes.length; ind++) {
        const { index, owned } = axisPlacedNodes[ind];
        const {
          index: prevIndex,
          owned: prevOwned,
          bbox: prevBBox,
        } = axisPlacedNodes[ind - 1];
        const curHeightBetween = calcHeightBetweenIndices(
          sortedNodes,
          axisPlacedNodes[0].index,
          axisPlacedNodes[1].index
        );
        const curCalculatedSpacing =
          (owned.x - (prevOwned.x + prevBBox.width) - curHeightBetween) /
          (index - prevIndex);

        if (curCalculatedSpacing !== calculatedSpacing) {
          return { canPerformOperation: false, sortedNodes: modifiedData };
        }
      }
    }
    let y = startingY;
    for (const { data } of sortedNodes) {
      updatedPositions.push({
        id: data.id,
        type: "geo",
        x: data.owned.x,
        y: y,
      });
      // update node positioning
      if (data.bbox.y !== undefined) {
        data.owned.yOwner = uid;
      }
      data.owned.y = y;
      data.bbox.y = undefined;

      // update y
      y += data.bbox.height + calculatedSpacing;
    }
  }

  return {
    canPerformOperation: true,
    sortedNodes: sortedNodes,
    updatedPositions: updatedPositions,
    spacing: calculatedSpacing,
  };
};
// Given data of selected nodes, if the stack layout operation can be completed,
// returns a new array corresponding to the new positions of the nodes;
// otherwise, returns false.
//
// Can optionally defined spacing; if not, tries to space based on distance between objects
//
// Tries to center align on the secondary axis, but if that doesn't work, for now
// just maintains current locations of nodes
export const getStackLayout = (
  childrenData: any[],
  operation: string,
  uid: string,
  spacing?: number,
  sorted?: boolean,
  alignment?: string
) => {
  // try stacking with bboxes given back to nodes
  let modifiedData = childrenData.map((data) => ({
    ...data,
    bbox: {
      ...data.bbox,
      x: data.owned.xOwner === uid ? data.owned.x : data.bbox.x,
      y: data.owned.yOwner === uid ? data.owned.y : data.bbox.y,
    },
    owned: {
      ...data.owned,
      x: data.owned.xOwner === uid ? undefined : data.owned.x,
      y: data.owned.yOwner === uid ? undefined : data.owned.y,
      xOwner: data.owned.xOwner === uid ? undefined : data.owned.xOwner,
      yOwner: data.owned.yOwner === uid ? undefined : data.owned.yOwner,
    },
  }));

  // TODO: make this loop through all other alignment values

  if (!["horizontal", "vertical"].includes(operation)) {
    return {
      canPerformOperation: false,
      sortedNodes: modifiedData,
      updatedPositions: [],
    };
  }

  let alignmentsToTry: Alignment[] = alignment
    ? [alignment as Alignment]
    : operation === "vertical"
    ? ["center-horizontal", "right", "left"]
    : ["center-vertical", "top", "bottom"];

  let updatedNodeData: any[] = [];

  let canAlign = false;

  for (const curAlignment of alignmentsToTry) {
    const {
      canPerformOperation,
      updatedNodeData: alignedNodeData,
      alignX,
      alignY,
    } = getAlignLayout(modifiedData, curAlignment, uid);
    if (canPerformOperation) {
      updatedNodeData = alignedNodeData ?? [];
      alignment = curAlignment;
      canAlign = true;
      break;
    }
  }

  if (canAlign) modifiedData = updatedNodeData;
  else {
    alert("[Stack] Couldn't align items due to contradictory positions");
  }

  return {
    ...getDistributeLayout(modifiedData, operation, uid, spacing, sorted),
    stackAlignment: alignment,
  };
};

/**
 * Given the current set of nodes and the index that's been changed, cascades layout changes to
 * all nodes below the index of the node that was changed
 */
export const relayout = (nodes: any[], indexChanged: number) => {
  // instead of a map, use a for loop so that we can modify the nodes easier

  let updatedNodes: any[] = [];
  let positionsToUpdate: any[] = [];

  for (let ind = 0; ind < nodes.length; ind++) {
    const curNode = nodes[ind];
    if (ind <= indexChanged) {
      updatedNodes.push({ ...curNode });
      continue;
    }
    if (curNode.type === Component.Align) {
      const childrenData = updatedNodes
        .filter((childNode: any) =>
          curNode.data.childrenIds?.includes(childNode.recordId)
        )
        .map((childNode: any) => childNode.data);
      const alignment = curNode.data.data.alignment;

      const { canPerformOperation: alignable, updatedNodeData } =
        getAlignLayout(childrenData, alignment, curNode.recordId);

      if (!alignable || !updatedNodeData) {
        // This is a problem
        alert("Couldn't cascade edit -- contradictory positions determined");
        console.log(
          "Couldn't cascade edit -- contradictory positions determined"
        );
        continue;
      }

      positionsToUpdate = positionsToUpdate.concat(
        updatedNodeData.map((data: any) => ({
          id: data.id,
          type: "geo",
          x: data.bbox.x ?? data.owned.x,
          y: data.bbox.y ?? data.owned.y,
        }))
      );
      updatedNodes = updatedNodes.map((updatedNode) => {
        if (!curNode.data.childrenIds?.includes(updatedNode.id)) {
          return updatedNode;
        }
        return {
          ...updatedNode,
          data: _.find(updatedNodeData, (data) => data.id === updatedNode.id),
        };
      });

      updatedNodes.push({ ...curNode });
    } else if (curNode.type === Component.Distribute) {
      const orderedData = curNode.data.childrenIds
        .map((id: any) => _.find(updatedNodes, (n) => n.recordId === id))
        .map((childNode: any) => childNode.data);

      const { canPerformOperation, updatedPositions, sortedNodes } =
        getDistributeLayout(
          orderedData,
          curNode.data.data.direction,
          curNode.recordId,
          curNode.data.data.spacing,
          true
        );

      if (!canPerformOperation) {
        console.log("[Distribute] can't update Distribute component");
        // This is also a problem
        continue;
      }
      updatedNodes = updatedNodes.map((updatedNode: any) => {
        const position = (curNode.data.childrenIds ?? []).indexOf(
          updatedNode.id
        );
        if (position === -1) {
          return updatedNode;
        }

        return {
          ...updatedNode,
          data: { ...sortedNodes[position].data },
        };
      });

      positionsToUpdate = positionsToUpdate.concat(updatedPositions);

      updatedNodes.push({ ...curNode });
    } else if (curNode.type === Component.Stack) {
      const orderedData = curNode.data.childrenIds
        .map((id: any) => _.find(updatedNodes, (n) => n.recordId === id))
        .map((childNode: any) => childNode.data);

      const { canPerformOperation, updatedPositions, sortedNodes } =
        getStackLayout(
          orderedData,
          curNode.data.data.direction,
          curNode.recordId,
          curNode.data.data.spacing,
          true,
          curNode.data.data.alignment
        );

      if (!canPerformOperation) {
        console.log("[Stack] can't update stack");
        // What should we do in this case?
        continue;
      }
      updatedNodes = updatedNodes.map((updatedNode: any) => {
        const position = (curNode.data.childrenIds ?? []).indexOf(
          updatedNode.id
        );
        if (position === -1) {
          return updatedNode;
        }

        return {
          ...updatedNode,
          data: { ...sortedNodes[position].data },
        };
      });

      positionsToUpdate = positionsToUpdate.concat(updatedPositions);

      updatedNodes.push({ ...curNode });
    } else if (curNode.type === Component.Background) {
      const childrenData = updatedNodes
        .filter((node) => curNode.data.childrenIds.includes(node.recordId))
        .map((node) => node.data);
      const { backgroundPosition, backgroundBBox } = getBackgroundLayout(
        childrenData,
        curNode.data.data.padding,
        curNode.data.id
      );
      positionsToUpdate.push(backgroundPosition);
      updatedNodes.push({
        ...curNode,
        data: { ...curNode.data, bbox: backgroundBBox },
      });
    } else if (curNode.type === Component.Group) {
      let selectedNodes = updatedNodes.filter((node: any) =>
        curNode.data.childrenIds.includes(node.recordId)
      ); // selected nodes
      const childBBoxes = selectedNodes.map((node: any) => ({
        x: node.data.bbox.x ?? node.data.owned.x,
        y: node.data.bbox.y ?? node.data.owned.y,
        width: node.data.bbox.width ?? node.data.owned.width,
        height: node.data.bbox.height ?? node.data.owned.height,
      }));
      const groupBBox = getChildrenBBox(childBBoxes);
      updatedNodes.push({
        ...curNode,
        data: {
          ...curNode.data,
          bbox: groupBBox,
        },
      });
    } else {
      updatedNodes.push({ ...curNode });
    }
  }
  return { updatedNodes: updatedNodes, positionsToUpdate: positionsToUpdate };
};
