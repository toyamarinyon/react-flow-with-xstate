import { createActorContext } from "@xstate/react";
import { reactFlowMachine } from "./store";

export const ReactFlowMachineContext = createActorContext(reactFlowMachine);

export const useReactFlowMachineState = () =>
	ReactFlowMachineContext.useSelector((state) => state);
export const useReactFlowMachineActor = ReactFlowMachineContext.useActorRef;
