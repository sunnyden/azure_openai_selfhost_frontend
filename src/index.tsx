import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
// Configure Monaco Editor to load locally instead of from CDN
import "./utils/monacoConfig";
import { UserContextProvider } from "./data/context/UserContext";
import { ModelProvider } from "./data/context/ModelContext";
import { ConversationProvider } from "./data/context/ConversationContext";
import { ConversationHistoryProvider } from "./data/context/ConversationHistoryContext";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement
);
root.render(
	<React.StrictMode>
		<UserContextProvider>
			<ModelProvider>
				<ConversationHistoryProvider>
					<ConversationProvider>
						<App />
					</ConversationProvider>
				</ConversationHistoryProvider>
			</ModelProvider>
		</UserContextProvider>
	</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
