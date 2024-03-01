import { useCallback, useContext } from "react";
import "./panel.css";
import { EditorContext, TreeNodesContext } from "../editor";
import { Node } from "./node";
import { getBackgroundLayout, relayout } from "../layoutUtils";
import _ from "lodash";

export type BackgroundPanelData = {
    padding: number;
};

export type BackgroundPanelProps = {
    data: Node<BackgroundPanelData>;
    name: string;
};

enum BackgroundChangeTarget {
    padding
}

export function BackgroundPanel({ data, name }: BackgroundPanelProps) {
    const { editor, setEditor } = useContext(EditorContext);
    const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);

    const onChange = useCallback((evt: any, target: BackgroundChangeTarget) => {
        const childrenData = treeNodes
            .filter((node: any) => data.childrenIds?.includes(node.recordId))
            .map((node: any) => node.data);
        const { backgroundBBox, backgroundPosition } = getBackgroundLayout(childrenData, +evt.target.value as number, data.id);
        const index = _.findIndex(
            treeNodes,
            (node: any) => node.recordId === data.id
        );
        const { updatedNodes, positionsToUpdate } = relayout(
            treeNodes.map((treeNode: any) => {
                if (treeNode.recordId !== data.id) return treeNode;
                return { ...treeNode, data: { ...treeNode.data, bbox: backgroundBBox, data: { padding: +evt.target.value as number } } };
            }),
            index
        );
        setTreeNodes(updatedNodes);
        editor.updateShapes([backgroundPosition]).updateShapes(positionsToUpdate);

    }, []);

    return (
        <div className="panel">
            <h2 className="header">Background</h2>
            <div className="properties">
                <div>
                    <label htmlFor="padding">padding: </label>

                    <input
                        id="padding"
                        type="number"
                        onChange={(evt) => onChange(evt, BackgroundChangeTarget.padding)}
                        className="nodrag"
                        value={Math.round(data.data.padding)}
                        size={5}
                    />
                </div>

            </div>
        </div>
    );
}
