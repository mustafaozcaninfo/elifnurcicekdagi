import { SiteProvider } from "./context/SiteContext";
import About from "./sections/About";
import Experiences from "./sections/Experiences";
import Explorer from "./sections/Explorer";
import Footer from "./sections/Footer";
import Hero from "./sections/Hero";
import Journeys from "./sections/Journeys";
import Marquee from "./sections/Marquee";

export default function App() {
	return (
		<SiteProvider>
			<div className="overflow-x-clip">
				<Hero />
				<Marquee />
				<Explorer />
				<About />
				<Experiences />
				<Journeys />
				<Footer />
			</div>
		</SiteProvider>
	);
}
