import { useMachine } from "@xstate/react";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import { reactFlowMachine } from "./store";

function Flow() {
	const [snapshot, send] = useMachine(reactFlowMachine);
	if (snapshot.value === "loadStore") {
		return null;
	}

	return (
		<div style={{ height: "100vh", width: "100vw" }}>
			<ReactFlow
				nodes={snapshot.context.nodes}
				onNodesChange={(changeNodes) =>
					send({ type: "nodes.change", changeNodes })
				}
				edges={snapshot.context.edges}
				onEdgesChange={(changeEdges) =>
					send({ type: "edges.change", changeEdges })
				}
				onConnect={(connection) => send({ type: "connect", connection })}
				onInit={(reactFlowInstance) =>
					send({ type: "reactFlowInstance.set", reactFlowInstance })
				}
				fitView
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
}

export default Flow;
