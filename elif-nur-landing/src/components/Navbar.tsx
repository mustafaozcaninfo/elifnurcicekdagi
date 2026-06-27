import FadeIn from "./FadeIn";
import { useSite } from "../hooks/useSite";

const ANCHORS = [
	{ label: "Explorer", href: "#explorer" },
	{ label: "About", href: "#about" },
	{ label: "Journeys", href: "#journeys" },
	{ label: "Experiences", href: "#experiences" },
] as const;

export default function Navbar() {
	const { branding, navigation } = useSite();

	const links = [
		...ANCHORS,
		...navigation
			.filter((n) => !n.path.startsWith("#") && n.path !== "/")
			.map((n) => ({ label: n.label, href: n.path })),
		{ label: "Contact", href: "/iletisim" },
	];

	return (
		<FadeIn delay={0.1} y={-16} duration={0.7}>
			<header className="fixed inset-x-0 top-0 z-50 px-6 py-6 md:px-10">
				<nav
					className="mx-auto flex max-w-7xl items-center justify-between"
					aria-label="Ana navigasyon"
				>
					<a
						href="#"
						className="font-kanit text-lg font-semibold tracking-wide text-warm-light transition-opacity hover:opacity-70 md:text-xl"
					>
						{branding.siteName}
					</a>
					<ul className="hidden items-center gap-8 sm:flex">
						{links.map((link) => (
							<li key={link.href}>
								<a
									href={link.href}
									className="font-kanit text-[0.7rem] font-medium uppercase tracking-[0.22em] text-warm-light/90 transition-opacity hover:opacity-70"
								>
									{link.label}
								</a>
							</li>
						))}
					</ul>
					<a
						href="/iletisim"
						className="font-kanit text-[0.65rem] font-medium uppercase tracking-[0.2em] text-warm-light/90 transition-opacity hover:opacity-70 sm:hidden"
					>
						Contact
					</a>
				</nav>
			</header>
		</FadeIn>
	);
}
