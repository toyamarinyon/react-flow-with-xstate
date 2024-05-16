import ReactFlow, { Controls, Background, type NodeTypes } from "reactflow";
import "reactflow/dist/style.css";
import { createId } from "@paralleldrive/cuid2";
import { useMemo } from "react";
import { ColorChooserNode } from "./color-change-node";
import {
	useReactFlowMachineActor,
	useReactFlowMachineState,
} from "./use-react-flow-machine";

function Flow() {
	const state = useReactFlowMachineState();
	const { send } = useReactFlowMachineActor();
	const nodeTypes = useMemo<NodeTypes>(
		() => ({
			color: ColorChooserNode,
		}),
		[],
	);
	if (state.value === "loadStore") {
		return null;
	}

	return (
		<div style={{ height: "100vh", width: "100vw" }}>
			<ReactFlow
				nodeTypes={nodeTypes}
				nodes={state.context.nodes}
				onNodesChange={(changeNodes) =>
					send({ type: "nodes.change", changeNodes })
				}
				edges={state.context.edges}
				onEdgesChange={(changeEdges) =>
					send({ type: "edges.change", changeEdges })
				}
				onConnect={(connection) => send({ type: "connect", connection })}
				onInit={(reactFlowInstance) =>
					send({ type: "reactFlowInstance.set", reactFlowInstance })
				}
				zoomOnDoubleClick={false}
				onDoubleClick={(mouseEvent) => {
					mouseEvent.preventDefault();
					send({
						type: "nodes.add",
						node: { id: createId(), type: "color", data: {} },
						mouseEvent,
					});
				}}
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
}

export default Flow;
