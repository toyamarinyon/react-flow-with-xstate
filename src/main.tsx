import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ReactFlowMachineContext } from "./use-react-flow-machine.ts";

const root = document.getElementById("root");

if (root == null) {
	throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<ReactFlowMachineContext.Provider>
			<App />
		</ReactFlowMachineContext.Provider>
	</React.StrictMode>,
);
