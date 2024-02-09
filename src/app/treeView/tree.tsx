import { Tree } from "react-arborist";
import { IconoirProvider, NavArrowDown, NavArrowRight } from "iconoir-react";
import { useContext, useEffect, useRef } from "react";
import { SelectionContext, TreeNodesContext, EditorContext } from "../editor";
import { Component } from "../configurationPanel/node";
import _ from "lodash";

type TreeViewProps = {
  data: any[];
};
// Tree view for twofish
export function TreeView({ data }: TreeViewProps) {
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);
  const { selectedTreeNodes, selectedTreeRelations, setSelectedTreeNodes } =
    useContext(SelectionContext);
  const treeRef = useRef();

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
              childrenIds: treeNodes.childrenIds.filter(
                (childId) => !ids.includes(childId)
              ),
            },
          };
        });
    });
    setEditor(editor.deleteShapes(ids).complete());
  };
  return (
    <IconoirProvider
      iconProps={{
        color: "#000",
        strokeWidth: 2,
        width: "16px",
        height: "16px",
      }}
    >
      <div
        style={{
          width: "15vw",
          height: "100vh",
          background: "#eee",
          padding: 10,
          borderRight: "2px solid black",
        }}
      >
        <h2 style={{ fontWeight: 600 }}>Objects</h2>
        <Tree
          data={data}
          width="10vw"
          padding={10}
          className="tree-body"
          onDelete={onDelete}
          ref={treeRef}
        >
          {TreeNode}
        </Tree>
      </div>
    </IconoirProvider>
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
      className={`tree-node ${node.isSelected ? "selected" : "unselected"}`}
      onClick={handleClick}
    >
      {!node.isLeaf ? (
        <button onClick={() => node.toggle()}>
          {node.isOpen ? <NavArrowDown /> : <NavArrowRight />}
        </button>
      ) : (
        <span style={{ width: 16, display: "inline-block" }}></span>
      )}
      {node.isLeaf ? "Δ " : "≡ "}
      {node.data.name}
    </div>
  );
}
