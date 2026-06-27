import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SiteProvider } from "../context/SiteContext";
import AboutMe from "../sections/AboutMe";
import "../index.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<SiteProvider>
			<AboutMe />
		</SiteProvider>
	</StrictMode>,
);
