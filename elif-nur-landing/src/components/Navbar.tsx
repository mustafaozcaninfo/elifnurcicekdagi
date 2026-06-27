import { motion } from "framer-motion";
import { useSite } from "../hooks/useSite";
import NavbarBrand from "./NavbarBrand";

export default function Navbar({
	variant = "default",
	visible = true,
	linkHref = "/contact",
	linkLabel = "Contact",
	layer = "front",
}: {
	variant?: "default" | "deck";
	visible?: boolean;
	linkHref?: string;
	linkLabel?: string;
	/** Explorer: sit behind filter chrome so pills stay tappable. */
	layer?: "front" | "back";
}) {
	const { branding } = useSite();
	const isDeck = variant === "deck";
	const isBack = layer === "back";

	return (
		<motion.header
			className={`fixed inset-x-0 top-0 ${
				isBack ? "z-30 px-3 py-2 md:px-10 md:py-5" : "z-50 px-4 py-4 sm:px-6 sm:py-5 md:px-10"
			}`}
			initial={isDeck ? { opacity: 0, y: -12 } : false}
			animate={
				isDeck
					? { opacity: visible ? 1 : 0, y: visible ? 0 : -12 }
					: { opacity: 1, y: 0 }
			}
			transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
		>
			<nav
				className={`mx-auto flex max-w-7xl items-center justify-between gap-2 md:gap-3 ${
					isDeck
						? `rounded-2xl border border-white/10 bg-[#080604]/55 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-full ${
								isBack
									? "px-2.5 py-1.5 sm:px-5 sm:py-3"
									: "px-3 py-2.5 sm:px-5 sm:py-3"
							}`
						: ""
				}`}
				aria-label="Primary navigation"
			>
				{isDeck ? (
					<NavbarBrand siteName={branding.siteName} compact={isBack} />
				) : (
					<a
						href="/"
						className="font-kanit text-lg font-semibold tracking-wide text-warm-light transition-opacity hover:opacity-80 md:text-xl"
					>
						{branding.siteName}
					</a>
				)}
				<a
					href={linkHref}
					className="shrink-0 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-kanit text-[0.58rem] font-medium uppercase tracking-[0.16em] text-warm-light/90 transition-all hover:border-warm-mustard/35 hover:bg-warm-mustard/10 hover:text-warm-light sm:border-transparent sm:bg-transparent sm:px-0 sm:py-0 sm:text-[0.62rem] sm:tracking-[0.18em]"
				>
					{linkLabel}
				</a>
			</nav>
		</motion.header>
	);
}
