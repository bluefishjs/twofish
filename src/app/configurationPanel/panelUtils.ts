import { TreeNode } from "./node";

export const changeNodeName = (
  treeNodes: TreeNode<any>[],
  recordId: string,
  name: string
) => {
  return treeNodes.map((treeNode: TreeNode<any>) => {
    if (treeNode.recordId !== recordId) {
      if (
        treeNode.data.childrenIds &&
        treeNode.data.childrenIds.includes(recordId)
      )
        return {
          ...treeNode,
          children: treeNode.children.map((child) =>
            child.recordId === recordId ? { ...child, name: name } : child
          ),
        };
      return treeNode;
    }
    return {
      ...treeNode,
      name: name,
    };
  });
};
