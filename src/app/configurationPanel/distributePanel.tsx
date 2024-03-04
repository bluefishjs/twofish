import { Node } from "./node";
export type DistributePanelData = {
  direction: "horizontal" | "vertical";
  spacing: number;
};

export type DistributePanelProps = {
  data: Node<DistributePanelData>;
  name: string;
};

enum DistributeChangeTarget {
  direction,
  alignment,
  spacing,
}
export function DistributePanel(data: DistributePanelProps) {
  return <></>;
}
