import { motion } from "framer-motion";
import { useSite } from "../hooks/useSite";

export default function Navbar({
	variant = "default",
	visible = true,
	linkHref = "/contact",
	linkLabel = "Contact",
}: {
	variant?: "default" | "deck";
	visible?: boolean;
	linkHref?: string;
	linkLabel?: string;
}) {
	const { branding } = useSite();
	const isDeck = variant === "deck";

	return (
		<motion.header
			className="fixed inset-x-0 top-0 z-50 px-6 py-5 md:px-10"
			initial={isDeck ? { opacity: 0, y: -12 } : false}
			animate={
				isDeck
					? { opacity: visible ? 1 : 0, y: visible ? 0 : -12 }
					: { opacity: 1, y: 0 }
			}
			transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
		>
			<nav
				className={`mx-auto flex max-w-7xl items-center justify-between ${
					isDeck
						? "rounded-full border border-white/10 bg-black/35 px-5 py-3 backdrop-blur-md"
						: ""
				}`}
				aria-label="Primary navigation"
			>
				<a
					href="/"
					className="font-kanit text-lg font-semibold tracking-wide text-warm-light transition-opacity hover:opacity-80 md:text-xl"
				>
					{branding.siteName}
				</a>
				<a
					href={linkHref}
					className="font-kanit text-[0.62rem] font-medium uppercase tracking-[0.18em] text-warm-light/85 transition-opacity hover:opacity-70"
				>
					{linkLabel}
				</a>
			</nav>
		</motion.header>
	);
}
