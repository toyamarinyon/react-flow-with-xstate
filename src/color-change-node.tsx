import type { FC } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { type ActorRefFrom, sendTo, setup } from "xstate";
import type { reactFlowMachine } from "./store";

export const colorChooserMachine = setup({
	types: {
		context: {} as {
			parentRef: ActorRefFrom<typeof reactFlowMachine>;
			nodeId: string;
		},
		input: {} as {
			parentRef: ActorRefFrom<typeof reactFlowMachine>;
			nodeId: string;
		},
		events: {} as {
			type: "node.change";
			color: string;
		},
	},
}).createMachine({
	context: ({ input }) => input,
	on: {
		"node.change": {
			actions: [
				sendTo(
					({ context }) => context.parentRef,
					({ event, context }) => ({
						type: "node.changeData",
						data: { color: event.color },
						nodeId: context.nodeId,
					}),
				),
			],
		},
	},
});

type NodeData = {
	color: string;
	ref: ActorRefFrom<typeof colorChooserMachine>;
};

export const ColorChooserNode: FC<NodeProps<NodeData>> = ({ data }) => {
	return (
		<div style={{ backgroundColor: data.color, borderRadius: 10 }}>
			<Handle type="target" position={Position.Top} />
			<div style={{ padding: 20 }}>
				<input
					type="color"
					defaultValue={data.color}
					onChange={(event) =>
						data.ref.send({ type: "node.change", color: event.target.value })
					}
					className="nodrag"
				/>
			</div>
			<Handle type="source" position={Position.Bottom} />
		</div>
	);
};
