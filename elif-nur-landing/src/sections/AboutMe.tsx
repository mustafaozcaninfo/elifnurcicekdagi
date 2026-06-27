import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Plane } from "lucide-react";
import ContactButton from "../components/ContactButton";
import Navbar from "../components/Navbar";
import { EXPERIENCES, PILOT_COCKPIT_PORTRAIT } from "../data/images";
import { useSite } from "../hooks/useSite";

function HudCorner({ className }: { className: string }) {
	return (
		<div
			className={`pointer-events-none absolute h-16 w-16 border-warm-mustard/25 ${className}`}
			aria-hidden
		/>
	);
}

export default function AboutMe() {
	const { about, branding } = useSite();
	const year = new Date().getFullYear();
	const fullName = branding.siteName.includes("Özcan")
		? branding.siteName
		: `${branding.siteName} Çiçekdağı Özcan`;

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

				<div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
					<motion.div
						className="relative lg:pt-2"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
					>
						<HudCorner className="left-0 top-0 border-l-2 border-t-2" />
						<HudCorner className="bottom-8 right-0 border-b-2 border-r-2" />

						<div className="flex flex-wrap items-center gap-2">
							<span className="rounded border border-warm-terracotta/35 bg-warm-terracotta/10 px-2 py-0.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-warm-terracotta">
								IST · Origin
							</span>
							<span className="rounded border border-warm-mustard/35 bg-warm-mustard/10 px-2 py-0.5 font-ui text-[0.52rem] font-semibold uppercase tracking-[0.18em] text-warm-mustard">
								B777 · Airline pilot
							</span>
						</div>

						<p className="mt-4 font-kanit text-[0.62rem] font-medium uppercase tracking-[0.32em] text-warm-terracotta">
							Origin · Istanbul · Turkey
						</p>
						<h1 className="mt-3 font-kanit text-4xl font-bold leading-tight text-warm-light md:text-5xl">
							Hi, I&apos;m <span className="text-gradient">Elif</span>
						</h1>
						<p className="mt-4 max-w-lg font-kanit text-base font-light leading-relaxed text-warm-light/90 md:text-lg">
							Airline pilot · Born between continents · This is where the story starts before
							every climb.
						</p>

						<article className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-sm md:p-6">
							<p className="font-kanit text-[0.55rem] uppercase tracking-[0.28em] text-warm-terracotta">
								About me
							</p>
							<p className="mt-3 font-body text-sm leading-relaxed text-warm-muted md:text-[0.95rem]">
								{about.body}
							</p>
						</article>

						<div className="mt-8 space-y-4">
							<p className="font-kanit text-[0.55rem] uppercase tracking-[0.28em] text-warm-muted">
								Flight deck &amp; beyond
							</p>
							<ul className="space-y-3">
								{EXPERIENCES.map((exp) => (
									<li
										key={exp.num}
										className="rounded-xl border border-white/8 bg-black/25 px-4 py-3"
									>
										<p className="font-kanit text-sm font-semibold text-warm-light">
											<span className="mr-2 font-mono text-[0.62rem] text-warm-mustard/80">
												{exp.num}
											</span>
											{exp.title}
										</p>
										<p className="mt-1.5 font-ui text-xs leading-relaxed text-warm-muted">
											{exp.desc}
										</p>
									</li>
								))}
							</ul>
						</div>

						<article className="mt-8 rounded-2xl border border-warm-sage/20 bg-warm-sage/5 p-5 md:p-6">
							<p className="font-kanit text-[0.55rem] uppercase tracking-[0.28em] text-warm-sage">
								Turkey on the map
							</p>
							<p className="mt-3 font-body text-sm leading-relaxed text-warm-muted">
								Istanbul where Europe and Asia touch, Ankara&apos;s capital skies, Antalya&apos;s
								Mediterranean glow, and Izmir&apos;s Aegean breeze — the homeland I carry into
								every cockpit.
							</p>
						</article>

						<div className="mt-10 flex flex-wrap gap-3">
							<ContactButton href="/" variant="secondary">
								Explore journey map
							</ContactButton>
							<ContactButton href="/contact">Contact me</ContactButton>
						</div>
					</motion.div>

					<motion.div
						className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:sticky lg:top-28"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
					>
						<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080604]/80 shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
							<div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/45 px-4 py-2.5 backdrop-blur-md">
								<span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-warm-mustard">
									ENF·001
								</span>
								<span className="flex items-center gap-1.5 font-ui text-[0.52rem] uppercase tracking-[0.16em] text-warm-muted">
									<Plane className="h-3 w-3 text-warm-mustard/80" strokeWidth={1.5} />
									Flight deck
								</span>
							</div>

							<img
								src={PILOT_COCKPIT_PORTRAIT}
								alt={`${fullName} in the Boeing 777 flight deck`}
								className="aspect-[3/4] w-full object-cover object-[center_22%]"
								width={1440}
								height={1920}
								fetchPriority="high"
							/>

							<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#030201] via-[#030201]/85 to-transparent px-4 pb-4 pt-16">
								<p className="font-kanit text-lg font-semibold text-warm-light">{fullName}</p>
								<p className="mt-1 flex items-center gap-1.5 font-ui text-xs text-warm-muted">
									<MapPin className="h-3 w-3 shrink-0 text-warm-terracotta" strokeWidth={1.5} />
									Istanbul origin · Worldwide routes
								</p>
							</div>

							<div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" aria-hidden />
						</div>

						<p className="mt-3 text-center font-ui text-[0.58rem] uppercase tracking-[0.2em] text-warm-muted/80 lg:text-left">
							Boeing 777 · Airline commander
						</p>
					</motion.div>
				</div>
			</main>

			<footer className="relative z-10 border-t border-white/5 px-5 py-8 md:px-10">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-ui text-xs text-warm-muted/70 md:flex-row">
					<p>&copy; {year} {fullName}</p>
					<nav className="flex gap-6" aria-label="Footer links">
						<a href="/about" className="text-warm-light transition-colors hover:text-warm-mustard">
							About
						</a>
						<a href="/contact" className="transition-colors hover:text-warm-light">
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
