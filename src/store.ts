import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type ReactFlowInstance,
  type ReactFlowJsonObject,
} from "reactflow";
import { assign, cancel, fromPromise, raise, setup } from "xstate";

const localStorageKey = "react-flow-state";

export const reactFlowMachine = setup({
  types: {
    context: {} as {
      nodes: Node[];
      edges: Edge[];
      reactFlowInstance: ReactFlowInstance | null;
    },
    events: {} as
      | { type: "nodes.change"; changeNodes: NodeChange[] }
      | { type: "edges.change"; changeEdges: EdgeChange[] }
      | { type: "connect"; connection: Connection }
      | { type: "nodes.set"; nodes: Node[] }
      | { type: "edges.set"; edges: Edge[] }
      | { type: "reactFlowInstance.set"; reactFlowInstance: ReactFlowInstance }
      | { type: "context.store" },
  },
  actors: {
    restoreState: fromPromise<ReactFlowJsonObject>(async () => {
      const data = localStorage.getItem(localStorageKey);
      return JSON.parse(data ?? "");
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
          actions: assign(({ event, context }) => ({
            ...context,
            nodes: event.output.nodes,
            edges: event.output.edges,
          })),
        },
      },
    },
    active: {},
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
    "context.store": {
      target: ".saveStore",
    },
    "nodes.change": {
      actions: raise(({ context, event }) => ({
        type: "nodes.set",
        nodes: applyNodeChanges(event.changeNodes, context.nodes),
      })),
    },
    "nodes.set": {
      actions: [
        cancel("context.store"),
        assign({
          nodes: ({ event }) => event.nodes,
        }),
        raise(
          { type: "context.store" },
          {
            id: "context-store",
            delay: 2000,
          },
        ),
      ],
    },

    "edges.change": {
      actions: raise(({ context, event }) => ({
        type: "edges.set",
        edges: applyEdgeChanges(event.changeEdges, context.edges),
      })),
    },
    "edges.set": [
      {
        actions: assign({
          edges: ({ event }) => event.edges,
        }),
      },
    ],
    connect: {
      actions: raise(({ context, event }) => ({
        type: "edges.set",
        edges: addEdge(event.connection, context.edges),
      })),
    },
    "reactFlowInstance.set": {
      actions: assign({
        reactFlowInstance: ({ event }) => event.reactFlowInstance,
      }),
    },
  },
});
