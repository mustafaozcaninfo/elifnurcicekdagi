import { motion } from "framer-motion";
import { ArrowLeft, Mail, MapPin, Shield } from "lucide-react";
import ContactForm from "../components/ContactForm";
import Navbar from "../components/Navbar";
import { useSite } from "../hooks/useSite";

function HudCorner({ className }: { className: string }) {
	return (
		<div
			className={`pointer-events-none absolute h-16 w-16 border-warm-mustard/25 ${className}`}
			aria-hidden
		/>
	);
}

export default function Contact() {
	const { branding } = useSite();
	const year = new Date().getFullYear();

	return (
		<div className="relative min-h-[100dvh] overflow-x-hidden bg-[#030201] text-warm-light">
			<div className="pointer-events-none absolute inset-0 deck-vignette" aria-hidden />
			<div className="pointer-events-none absolute inset-0 deck-scanlines opacity-60" aria-hidden />
			<div className="pointer-events-none absolute inset-0 bg-texture opacity-40" aria-hidden />

			<div
				className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm-terracotta/8 blur-[100px]"
				aria-hidden
			/>

			<Navbar variant="deck" linkHref="/" linkLabel="Explore map" />

			<main className="relative z-10 mx-auto max-w-6xl px-5 pb-10 pt-28 md:px-10 md:pb-16 md:pt-32">
				<motion.a
					href="/"
					className="mb-8 inline-flex items-center gap-2 font-ui text-xs font-medium text-warm-muted transition-colors hover:text-warm-light"
					initial={{ opacity: 0, x: -8 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.4 }}
				>
					<ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
					Back to journey map
				</motion.a>

				<div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
					<motion.div
						className="relative lg:pt-4"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
					>
						<HudCorner className="left-0 top-0 border-l-2 border-t-2" />
						<HudCorner className="bottom-8 right-0 border-b-2 border-r-2" />

						<p className="font-kanit text-[0.62rem] font-medium uppercase tracking-[0.32em] text-warm-terracotta">
							Ground link
						</p>
						<h1 className="mt-3 font-kanit text-4xl font-bold leading-tight text-warm-light md:text-5xl">
							<span className="text-gradient">Contact</span>
						</h1>
						<p className="mt-4 max-w-md font-ui text-sm leading-relaxed text-warm-muted md:text-[0.95rem]">
							Whether it&apos;s a collaboration, a question from the flight deck, or a note
							from somewhere on the map — your message is delivered securely.
						</p>

						<ul className="mt-8 space-y-4">
							<li className="flex items-start gap-3">
								<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/35">
									<Shield className="h-3.5 w-3.5 text-warm-sage" strokeWidth={1.5} />
								</span>
								<div>
									<p className="font-ui text-sm font-medium text-warm-light">Encrypted channel</p>
									<p className="mt-0.5 font-ui text-xs text-warm-muted">
										Protected by Cloudflare Turnstile and rate limiting.
									</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/35">
									<Mail className="h-3.5 w-3.5 text-warm-mustard" strokeWidth={1.5} />
								</span>
								<div>
									<p className="font-ui text-sm font-medium text-warm-light">Direct delivery</p>
									<p className="mt-0.5 font-ui text-xs text-warm-muted">
										Messages reach {branding.siteName} directly.
									</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/35">
									<MapPin className="h-3.5 w-3.5 text-warm-terracotta" strokeWidth={1.5} />
								</span>
								<div>
									<p className="font-ui text-sm font-medium text-warm-light">From anywhere</p>
									<p className="mt-0.5 font-ui text-xs text-warm-muted">
										Ground, air, or somewhere between — all welcome.
									</p>
								</div>
							</li>
						</ul>

						<p className="mt-10 font-ui text-[0.65rem] uppercase tracking-[0.2em] text-warm-muted/70">
							Channel status · <span className="text-warm-sage">OPEN</span>
						</p>
					</motion.div>

					<ContactForm />
				</div>
			</main>

			<footer className="relative z-10 border-t border-white/5 px-5 py-8 md:px-10">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-ui text-xs text-warm-muted/70 md:flex-row">
					<p>&copy; {year} {branding.siteName}. All rights reserved.</p>
					<nav className="flex gap-6" aria-label="Footer links">
						<a href="/contact" className="text-warm-light transition-colors hover:text-warm-mustard">
							Contact
						</a>
						<a href="/privacy" className="transition-colors hover:text-warm-light">
							Privacy
						</a>
					</nav>
				</div>
			</footer>
		</div>
	);
}
