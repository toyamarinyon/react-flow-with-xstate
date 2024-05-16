import { useSelector } from "@xstate/react";
import type { FC } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { type ActorRefFrom, log, setup } from "xstate";
// import { useReactFlowMachineActor } from "./use-react-flow-machine";

const colorChooserMachine = setup({}).createMachine({
	entry: log("hello"),
});

type NodeData = {
	color: string;
	ref: ActorRefFrom<typeof colorChooserMachine>;
};

export const ColorChooserNode: FC<NodeProps<NodeData>> = ({ data }) => {
	useSelector(data.ref, (state) => state);

	return (
		<div style={{ backgroundColor: data.color, borderRadius: 10 }}>
			<Handle type="target" position={Position.Top} />
			<div style={{ padding: 20 }}>
				{/* <input
					type="color"
					defaultValue={data.color}
					onChange={(evt) => updateNodeColor(id, evt.target.value)}
					className="nodrag"
				/> */}
			</div>
			<Handle type="source" position={Position.Bottom} />
		</div>
	);
};
