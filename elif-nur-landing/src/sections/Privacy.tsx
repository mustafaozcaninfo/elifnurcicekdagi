import { motion } from "framer-motion";
import { ArrowLeft, Database, Lock, Shield } from "lucide-react";
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="border-t border-white/8 pt-6 first:border-t-0 first:pt-0">
			<h2 className="font-kanit text-sm font-semibold uppercase tracking-[0.22em] text-warm-mustard">
				{title}
			</h2>
			<div className="mt-3 space-y-3 font-ui text-sm leading-relaxed text-warm-muted">{children}</div>
		</section>
	);
}

export default function Privacy() {
	const { branding } = useSite();
	const year = new Date().getFullYear();

	return (
		<div className="relative min-h-[100dvh] overflow-x-hidden bg-[#030201] text-warm-light">
			<div className="pointer-events-none absolute inset-0 deck-vignette" aria-hidden />
			<div className="pointer-events-none absolute inset-0 deck-scanlines opacity-60" aria-hidden />
			<div className="pointer-events-none absolute inset-0 bg-texture opacity-40" aria-hidden />

			<div
				className="pointer-events-none absolute left-1/2 top-1/4 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm-sage/6 blur-[100px]"
				aria-hidden
			/>

			<Navbar variant="deck" linkHref="/" linkLabel="Explore map" />

			<main className="relative z-10 mx-auto max-w-3xl px-5 pb-10 pt-28 md:px-10 md:pb-16 md:pt-32">
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

				<motion.div
					className="relative"
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
				>
					<HudCorner className="left-0 top-0 border-l-2 border-t-2" />
					<HudCorner className="bottom-8 right-0 border-b-2 border-r-2" />

					<p className="font-kanit text-[0.62rem] font-medium uppercase tracking-[0.32em] text-warm-sage">
						Data protection
					</p>
					<h1 className="mt-3 font-kanit text-4xl font-bold leading-tight text-warm-light md:text-5xl">
						<span className="text-gradient">Privacy Policy</span>
					</h1>
					<p className="mt-3 font-ui text-xs text-warm-muted/80">Last updated: 9 June 2026</p>
					<p className="mt-4 font-ui text-sm leading-relaxed text-warm-muted md:text-[0.95rem]">
						This policy explains how personal data is handled when you visit{" "}
						<strong className="font-medium text-warm-light">elifnurcicekdagi.com</strong> and use
						the contact form. Processing may also fall under Turkish data protection law (KVKK) where
						applicable.
					</p>

					<div className="mt-6 flex flex-wrap gap-3">
						<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 font-ui text-[0.65rem] text-warm-light">
							<Shield className="h-3.5 w-3.5 text-warm-sage" strokeWidth={1.5} />
							Consent-based contact
						</span>
						<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 font-ui text-[0.65rem] text-warm-light">
							<Lock className="h-3.5 w-3.5 text-warm-mustard" strokeWidth={1.5} />
							Turnstile &amp; rate limits
						</span>
						<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 font-ui text-[0.65rem] text-warm-light">
							<Database className="h-3.5 w-3.5 text-warm-terracotta" strokeWidth={1.5} />
							Cloudflare D1 storage
						</span>
					</div>
				</motion.div>

				<motion.article
					className="relative mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#080604]/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
				>
					<div
						className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warm-sage/45 to-transparent"
						aria-hidden
					/>

					<div className="space-y-6">
						<Section title="Data we collect">
							<ul className="list-disc space-y-2 pl-5">
								<li>
									<strong className="text-warm-light">Contact form:</strong> name, email address,
									and message content
								</li>
								<li>
									<strong className="text-warm-light">Technical logs:</strong> hashed IP address
									and browser type (via Cloudflare)
								</li>
							</ul>
						</Section>

						<Section title="How we use it">
							<p>
								Form data is used only to respond to your enquiry and to prevent abuse (rate
								limiting, bot protection). It is not used for marketing without your separate
								consent.
							</p>
						</Section>

						<Section title="Retention">
							<p>
								Contact submissions are stored in a secure database (Cloudflare D1). Records that
								are no longer needed may be deleted within a reasonable period.
							</p>
						</Section>

						<Section title="Third parties">
							<ul className="list-disc space-y-2 pl-5">
								<li>
									<strong className="text-warm-light">Cloudflare</strong> — hosting, security, and
									performance
								</li>
								<li>
									<strong className="text-warm-light">Cloudflare Turnstile</strong> — bot
									protection on the contact form
								</li>
								<li>
									<strong className="text-warm-light">Brevo</strong> — optional email notification
									when enabled
								</li>
							</ul>
						</Section>

						<Section title="Your rights">
							<p>
								You may request access, correction, or deletion of your personal data by using the{" "}
								<a
									href="/contact"
									className="text-warm-mustard underline-offset-2 hover:underline"
								>
									contact form
								</a>
								. Where KVKK applies, you may also have additional rights under Turkish law.
							</p>
						</Section>

						<Section title="Contact">
							<p>
								Questions about privacy:{" "}
								<a
									href="/contact"
									className="text-warm-mustard underline-offset-2 hover:underline"
								>
									elifnurcicekdagi.com/contact
								</a>
							</p>
						</Section>
					</div>
				</motion.article>
			</main>

			<footer className="relative z-10 border-t border-white/5 px-5 py-8 md:px-10">
				<div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 font-ui text-xs text-warm-muted/70 md:flex-row">
					<p>
						&copy; {year} {branding.siteName}. All rights reserved.
					</p>
					<nav className="flex gap-6" aria-label="Footer links">
						<a href="/contact" className="transition-colors hover:text-warm-light">
							Contact
						</a>
						<a href="/privacy" className="text-warm-light transition-colors hover:text-warm-mustard">
							Privacy
						</a>
					</nav>
				</div>
			</footer>
		</div>
	);
}
