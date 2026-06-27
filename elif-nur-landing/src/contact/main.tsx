import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SiteProvider } from "../context/SiteContext";
import Contact from "../sections/Contact";
import "../index.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<SiteProvider>
			<Contact />
		</SiteProvider>
	</StrictMode>,
);
