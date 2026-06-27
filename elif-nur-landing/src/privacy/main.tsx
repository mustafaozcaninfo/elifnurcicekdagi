import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SiteProvider } from "../context/SiteContext";
import Privacy from "../sections/Privacy";
import "../index.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<SiteProvider>
			<Privacy />
		</SiteProvider>
	</StrictMode>,
);
