import { SiteProvider } from "./context/SiteContext";
import Explorer from "./sections/Explorer";

export default function App() {
	return (
		<SiteProvider>
			<Explorer />
		</SiteProvider>
	);
}
