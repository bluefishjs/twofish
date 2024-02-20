import { Tree, TreeApi } from "react-arborist";
import { IconoirProvider, NavArrowDown, NavArrowRight } from "iconoir-react";
import { useContext, useEffect, useRef } from "react";
import { SelectionContext, TreeNodesContext, EditorContext } from "../editor";
import { Component } from "../configurationPanel/node";
import _ from "lodash";
import "./tree.css";

type TreeViewProps = {
  data: any[];
};


const componentIcons = {
  [Component.Rect]: <i className="fa fa-regular fa-square"></i>,
  [Component.Stack]: <i className="fa fa-solid fa-bars"></i>,
  [Component.Align]: <i className="fa-solid fa-align-left"></i>,
  [Component.Arrow]: <i className="fa fa-solid fa-rotate-left"></i>,
  [Component.Text]: <i className="fa fa-solid fa-font"></i>,
  [Component.Ellipse]: <i className="fa fa-regular fa-circle"></i>,
  [Component.Group]: <i className="fa fa-solid fa-layer-group"></i>,
  [Component.Background]: <i className="fa fa-solid fa-square-poll-vertical"></i>,
  [Component.Other]: <i className="fa fa-solid fa-caret-up"></i>,
}

// Tree view for twofish
export function TreeView({ data }: TreeViewProps) {
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);
  const { selectedTreeNodes, selectedTreeRelations, setSelectedTreeNodes, setSelectedTreeRelations } =
    useContext(SelectionContext);
  const treeRef = useRef<TreeApi<any> | undefined>();

  useEffect(() => {
    const tree = treeRef.current;
    tree?.deselectAll();
    selectedTreeNodes.forEach((selectedId: any) => {
      return tree?.get(selectedId)?.selectMulti();
    });
    selectedTreeRelations.forEach(({ recordId }) => {
      return tree?.get(recordId)?.selectMulti();
    });
  }, [selectedTreeNodes, selectedTreeRelations]);

  const onDelete = ({ ids }) => {
    setTreeNodes((treeNodes: any) => {
      return treeNodes
        .filter((treeNode: any) => !ids.includes(treeNode.recordId))
        .map((treeNode: any) => {
          if (
            !treeNode.data.childrenIds ||
            treeNode.data.childrenIds.length == 0
          ) {
            return treeNode;
          }
          return {
            ...treeNode,
            children: treeNode.children.filter(
              (child) => !ids.includes(child.recordId)
            ),
            data: {
              ...treeNode.data,
              childrenIds: treeNode.childrenIds.filter(
                (childId) => !ids.includes(childId)
              ),
            },
          };
        });
    });
    setEditor(editor.deleteShapes(ids).complete());
  };

  const onSelect = (nodes: any) => {
    const tree = treeRef.current;
    if (tree === undefined) return;

    const selectedTreeNodesSet = new Set(selectedTreeNodes);
    for (const node of tree.visibleNodes) {
      if (!node.isSelected && selectedTreeNodesSet.has(node.data.recordId)) {
        node.data.instanceSelected = true;
      }
      else {
        node.data.instanceSelected = false;
      }
    }
  }

  return (
    <div
    >
      <h2 style={{ fontWeight: 600 }}>Objects</h2>
      <Tree
        data={data}
        width="13vw"
        height={900}
        padding={10}
        className="tree-body"
        onDelete={onDelete}
        ref={treeRef}
        onSelect={onSelect}
      >
        {TreeNode}
      </Tree>
    </div>
  );
}

export function TreeNode({ node, style, dragHandle }: any) {
  /* This node instance can do many things. See the API reference. */
  // console.log(node);
  const {
    setSelectedTreeNodes,
    selectedTreeNodes,
    selectedTreeRelations,
    setSelectedTreeRelations,
  } = useContext(SelectionContext);
  const { setEditor } = useContext(EditorContext);

  const handleClick = () => {
    if (node.isSelected) {
      node.deselect();
      const newSelection = selectedTreeNodes.filter(
        (selectedId: any) => selectedId !== node.data.recordId
      );
      setSelectedTreeNodes(newSelection);
      if (node.children && node.children.length > 0) {
        setSelectedTreeRelations(
          selectedTreeRelations.filter(
            (selectedId: any) => selectedId !== node.data.recordId
          )
        );
        setEditor(editor?.deselect(...node.data.data.childrenIds).complete());
        return;
      }
      setEditor(editor?.deselect(node.data.recordId).complete());
      return;
    } else {
      if (selectedTreeNodes.includes(node.data.recordId)) {
        node.select();
        return;
      }
      setSelectedTreeNodes([...selectedTreeNodes, node.data.recordId]);
      if (node.children && node.children.length > 0) {
        setSelectedTreeRelations([
          ...selectedTreeRelations,
          {
            recordId: node.data.recordId,
            childrenIds: node.data.data.childrenIds,
          },
        ]);
        setEditor(editor?.select(...node.data.data.childrenIds).complete());
        return;
      } else {
        setEditor(editor?.select(node.data.recordId));
      }

      node.select();
      return;
    }
  };

  return (
    <div
      style={{ ...style, border: "solid black", borderWidth: "0px 0 1px 0" }}
      ref={dragHandle}
      className={`tree-node ${node.data.instanceSelected ? "instance-selected" : ""} ${node.isSelected ? "selected" : "unselected"}`}
      onClick={handleClick}
    >
      {!node.isLeaf ? (
        <button onClick={() => node.toggle()}>
          {node.isOpen ? <i className="fa fa-solid fa-angle-down"></i> : <i className="fa fa-solid fa-angle-right"></i>}
        </button>
      ) : (
        <span style={{ width: 16, display: "inline-block" }}></span>
      )}
      {componentIcons[node.data.name as Component]}
      {node.data.name}
    </div>
  );
}
