import {
	type Connection,
	type Edge,
	type EdgeChange,
	type Node,
	type NodeChange,
	type ReactFlowInstance,
	type ReactFlowJsonObject,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
} from "reactflow";
import {
	type ActorRefFrom,
	assign,
	cancel,
	fromPromise,
	raise,
	setup,
} from "xstate";
import { colorChooserMachine } from "./color-change-node";

const localStorageKey = "react-flow-state";

export const reactFlowMachine = setup({
	types: {
		context: {} as {
			nodes: Node[];
			edges: Edge[];
			reactFlowInstance: ReactFlowInstance | null;
		},
		events: {} as
			| {
					type: "nodes.add";
					node: Omit<Node, "position">;
					mouseEvent: React.MouseEvent<HTMLDivElement, MouseEvent>;
			  }
			| { type: "nodes.change"; changeNodes: NodeChange[] }
			| { type: "edges.change"; changeEdges: EdgeChange[] }
			| { type: "connect"; connection: Connection }
			| { type: "nodes.set"; nodes: Node[] }
			| { type: "edges.set"; edges: Edge[] }
			| { type: "reactFlowInstance.set"; reactFlowInstance: ReactFlowInstance }
			| { type: "debouncedSave" }
			| { type: "save" }
			| {
					type: "node.changeData";
					data: Record<string, unknown>;
					nodeId: string;
			  },
	},
	actors: {
		restoreState: fromPromise<ReactFlowJsonObject>(async () => {
			const data =
				localStorage.getItem(localStorageKey) ?? '{"nodes":[], "edges":[]}';
			return JSON.parse(data);
		}),
		saveState: fromPromise<unknown, { reactFlowInstance: ReactFlowInstance }>(
			async ({ input }) => {
				localStorage.setItem(
					localStorageKey,
					JSON.stringify(input.reactFlowInstance.toObject()),
				);
			},
		),
	},
}).createMachine({
	context: {
		nodes: [],
		edges: [],
		reactFlowInstance: null,
	},
	initial: "loadStore",
	states: {
		loadStore: {
			invoke: {
				src: "restoreState",
				onDone: {
					target: "active",
					actions: assign(({ event, context, spawn, self }) => ({
						...context,
						nodes: event.output.nodes.map(
							({ data, ...node }): Node => ({
								...node,
								data: {
									...data,
									ref: spawn(colorChooserMachine, {
										input: {
											nodeId: node.id,
											/**
											 * workaround: https://github.com/statelyai/xstate/issues/4485
											 */
											parentRef: self as ActorRefFrom<typeof reactFlowMachine>,
										},
									}),
								},
							}),
						),
						edges: event.output.edges,
					})),
				},
			},
		},
		active: {
			on: {
				debouncedSave: {
					actions: [
						cancel("raise-save"),
						raise(
							{ type: "save" },
							{
								id: "raise-save",
								delay: 1000,
							},
						),
					],
				},
				save: {
					target: "saveStore",
				},
			},
		},
		saveStore: {
			invoke: {
				src: "saveState",
				input: ({ context }) => {
					if (context.reactFlowInstance == null) {
						throw new Error("No reactFlowInstance");
					}
					return { reactFlowInstance: context.reactFlowInstance };
				},
				onDone: {
					target: "active",
				},
			},
		},
	},
	on: {
		"nodes.add": {
			actions: [
				assign({
					nodes: ({ context, event, spawn, self }) => {
						if (context.reactFlowInstance == null) {
							throw new Error("No reactFlowInstance");
						}
						const position = context.reactFlowInstance.screenToFlowPosition({
							x: event.mouseEvent.clientX,
							y: event.mouseEvent.clientY,
						});
						const node: Node = {
							...event.node,
							position,
							data: {
								...event.node.data,
								ref: spawn(colorChooserMachine, {
									input: {
										nodeId: event.node.id,
										/**
										 * workaround: https://github.com/statelyai/xstate/issues/4485
										 */
										parentRef: self as ActorRefFrom<typeof reactFlowMachine>,
									},
								}),
							},
						};

						return [...context.nodes, node];
					},
				}),
				raise({ type: "debouncedSave" }),
			],
		},
		"nodes.change": {
			actions: [
				assign({
					nodes: ({ context, event }) =>
						applyNodeChanges(event.changeNodes, context.nodes),
				}),
				raise({ type: "debouncedSave" }),
			],
		},
		"nodes.set": {
			actions: [
				assign({
					nodes: ({ event }) => event.nodes,
				}),
				raise({ type: "debouncedSave" }),
			],
		},
		"node.changeData": {
			actions: [
				assign({
					nodes: ({ context, event }) =>
						context.nodes.map((node) => {
							if (node.id === event.nodeId) {
								return {
									...node,
									data: {
										...node.data,
										...event.data,
									},
								};
							}

							return node;
						}),
				}),
				raise({ type: "debouncedSave" }),
			],
		},
		"edges.change": {
			actions: [
				assign({
					edges: ({ context, event }) =>
						applyEdgeChanges(event.changeEdges, context.edges),
				}),
				raise({ type: "debouncedSave" }),
			],
		},
		"edges.set": [
			{
				actions: [
					assign({
						edges: ({ event }) => event.edges,
					}),
					raise({ type: "debouncedSave" }),
				],
			},
		],
		connect: {
			actions: [
				assign({
					edges: ({ context, event }) =>
						addEdge(event.connection, context.edges),
				}),
				raise({ type: "debouncedSave" }),
			],
		},
		"reactFlowInstance.set": {
			actions: assign({
				reactFlowInstance: ({ event }) => event.reactFlowInstance,
			}),
		},
	},
});
