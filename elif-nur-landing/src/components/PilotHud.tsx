import { motion, AnimatePresence } from "framer-motion";
import type { ActiveFlight } from "../hooks/useLiveFlights";
import type { TravelMapData } from "../data/travel-map";
import { BOEING_777_COMPACT } from "./svg/boeing777";

export type DeckPhase = "boot" | "systems" | "globe" | "departure" | "cruise" | "reveal";

type Props = {
	phase: DeckPhase;
	primaryFlight: ActiveFlight | null;
	flights: ActiveFlight[];
	travelMap: TravelMapData;
	branding: { siteName: string };
	interactive?: boolean;
};

function pad(n: number, len = 3) {
	return String(n).padStart(len, "0");
}

export default function PilotHud({
	phase,
	primaryFlight,
	flights,
	travelMap,
	branding,
	interactive = false,
}: Props) {
	const opening = travelMap.opening;
	const hudVisible = phase !== "boot" && !interactive;
	const hudDimmed = interactive;
	const globeVisible = ["globe", "departure", "cruise", "reveal"].includes(phase);
	const contentVisible = ["cruise", "reveal"].includes(phase) && !interactive;
	const revealVisible = phase === "reveal" && !interactive;

	const alt = primaryFlight?.altitudeFt ?? 0;
	const hdg = primaryFlight ? Math.round(primaryFlight.bearing) : 274;
	const spd = primaryFlight ? Math.round(380 + primaryFlight.progress * 120) : 0;
	const fl = primaryFlight ? `FL${Math.round(alt / 100)}` : "FL000";
	const aircraft = primaryFlight?.aircraft ?? "B777";
	const departureVisible = phase === "departure" && !interactive;
	const globePhaseVisible = phase === "globe" && !interactive;

	return (
		<div
			className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
			aria-hidden
		>
			{/* Boot screen */}
			<AnimatePresence>
				{phase === "boot" && (
					<motion.div
						className="absolute inset-0 flex items-center justify-center bg-[#030201]"
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.6 }}
					>
						<motion.div
							className="flex flex-col items-center gap-4"
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 1, 1, 0.7] }}
							transition={{ duration: 2.2, times: [0, 0.15, 0.75, 1] }}
						>
							<div
								className="deck-plane-marker deck-plane-marker--b777 opacity-80"
								dangerouslySetInnerHTML={{ __html: BOEING_777_COMPACT }}
							/>
							<span className="font-kanit text-xs uppercase tracking-[0.5em] text-warm-terracotta/80">
								{opening?.boot ?? "Initializing flight deck"}
							</span>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Vignette + scanlines */}
			<div
				className={`deck-vignette absolute inset-0 transition-opacity duration-1000 ${
					globeVisible ? "opacity-100" : "opacity-40"
				}`}
			/>
			<div className={`deck-scanlines absolute inset-0 ${hudVisible ? "opacity-30" : "opacity-0"}`} />

			{/* SVG HUD frame */}
			<motion.svg
				className="absolute inset-0 h-full w-full"
				viewBox="0 0 1440 900"
				preserveAspectRatio="xMidYMid slice"
				initial={false}
				animate={{ opacity: hudVisible ? 1 : hudDimmed ? 0.12 : 0 }}
				transition={{ duration: 0.8 }}
			>
				<defs>
					<linearGradient id="hudStroke" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#D4A017" stopOpacity="0.9" />
						<stop offset="100%" stopColor="#C25B3F" stopOpacity="0.7" />
					</linearGradient>
					<filter id="hudGlow">
						<feGaussianBlur stdDeviation="2" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				{/* Corner brackets */}
				{[
					"M 48 48 L 48 120 L 120 120",
					"M 1392 48 L 1392 120 L 1320 120",
					"M 48 852 L 48 780 L 120 780",
					"M 1392 852 L 1392 780 L 1320 780",
				].map((d, i) => (
					<motion.path
						key={d}
						d={d}
						fill="none"
						stroke="url(#hudStroke)"
						strokeWidth="2"
						filter="url(#hudGlow)"
						initial={{ pathLength: 0, opacity: 0 }}
						animate={
							hudVisible
								? { pathLength: 1, opacity: 1 }
								: { pathLength: 0, opacity: 0 }
						}
						transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
					/>
				))}

				{/* Horizon arc */}
				<motion.path
					d="M 200 450 Q 720 380 1240 450"
					fill="none"
					stroke="rgba(212,160,23,0.35)"
					strokeWidth="1"
					strokeDasharray="6 10"
					initial={{ pathLength: 0 }}
					animate={{ pathLength: hudVisible ? 1 : 0 }}
					transition={{ duration: 1.2, delay: 0.3 }}
				/>

				{/* Pitch ladder */}
				{[-60, -30, 0, 30, 60].map((offset) => (
					<g key={offset} transform={`translate(720 ${450 + offset * 0.35})`}>
						<line
							x1="-80"
							y1="0"
							x2="80"
							y2="0"
							stroke="rgba(245,237,228,0.12)"
							strokeWidth="1"
						/>
						<text
							x="-95"
							y="4"
							fill="rgba(245,237,228,0.25)"
							fontSize="10"
							fontFamily="Kanit, sans-serif"
							textAnchor="end"
						>
							{offset > 0 ? `+${offset}` : offset}
						</text>
					</g>
				))}

				{/* Center reticle */}
				<motion.g
					initial={{ scale: 0.6, opacity: 0 }}
					animate={
						hudVisible ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }
					}
					transition={{ duration: 0.5, delay: 0.5 }}
				>
					<circle
						cx="720"
						cy="450"
						r="42"
						fill="none"
						stroke="rgba(212,160,23,0.45)"
						strokeWidth="1"
					/>
					<line x1="720" y1="400" x2="720" y2="415" stroke="#D4A017" strokeWidth="1.5" />
					<line x1="720" y1="485" x2="720" y2="500" stroke="#D4A017" strokeWidth="1.5" />
					<line x1="675" y1="450" x2="690" y2="450" stroke="#D4A017" strokeWidth="1.5" />
					<line x1="750" y1="450" x2="765" y2="450" stroke="#D4A017" strokeWidth="1.5" />
					<circle cx="720" cy="450" r="3" fill="#D4A017" />
				</motion.g>

				{/* Heading tape top */}
				<text
					x="720"
					y="88"
					fill="rgba(245,237,228,0.7)"
					fontSize="13"
					fontFamily="Kanit, sans-serif"
					textAnchor="middle"
					letterSpacing="0.35em"
				>
					HDG {pad(hdg, 3)}°
				</text>

				{/* Altitude tape left */}
				<g transform="translate(88 450)">
					<text
						fill="rgba(194,91,63,0.85)"
						fontSize="11"
						fontFamily="Kanit, sans-serif"
						letterSpacing="0.2em"
					>
						ALT
					</text>
					<text
						y="28"
						fill="#F5EDE4"
						fontSize="22"
						fontFamily="Kanit, sans-serif"
						fontWeight="600"
					>
						{alt.toLocaleString()}
					</text>
					<text y="48" fill="rgba(245,237,228,0.45)" fontSize="11" fontFamily="Kanit, sans-serif">
						FT
					</text>
				</g>

				{/* Speed tape right */}
				<g transform="translate(1320 450)" textAnchor="end">
					<text
						fill="rgba(194,91,63,0.85)"
						fontSize="11"
						fontFamily="Kanit, sans-serif"
						letterSpacing="0.2em"
					>
						SPD
					</text>
					<text
						y="28"
						fill="#F5EDE4"
						fontSize="22"
						fontFamily="Kanit, sans-serif"
						fontWeight="600"
					>
						{spd}
					</text>
					<text y="48" fill="rgba(245,237,228,0.45)" fontSize="11" fontFamily="Kanit, sans-serif">
						KTS
					</text>
				</g>

				{/* Flight level badge */}
				<rect
					x="680"
					y="130"
					width="80"
					height="26"
					rx="4"
					fill="rgba(15,10,5,0.55)"
					stroke="rgba(212,160,23,0.4)"
				/>
				<text
					x="720"
					y="148"
					fill="#D4A017"
					fontSize="12"
					fontFamily="Kanit, sans-serif"
					textAnchor="middle"
					letterSpacing="0.15em"
				>
					{fl} · {aircraft}
				</text>
			</motion.svg>

			{/* Systems boot text */}
			<AnimatePresence>
				{phase === "systems" && (
					<motion.div
						className="absolute left-1/2 top-[18%] -translate-x-1/2 text-center"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
					>
						<p className="font-kanit text-[0.65rem] uppercase tracking-[0.42em] text-warm-mustard/90">
							<span className="deck-blink">●</span>{" "}
							{opening?.systems ?? "Systems online · Atlas linked"}
						</p>
						<p className="mt-2 font-kanit text-[0.52rem] uppercase tracking-[0.28em] text-warm-muted/80">
							Airline Pilot · Boeing 777
						</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Globe reveal caption */}
			<AnimatePresence>
				{globePhaseVisible && (
					<motion.p
						className="absolute left-1/2 top-[22%] -translate-x-1/2 font-kanit text-[0.58rem] uppercase tracking-[0.36em] text-warm-light/70"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						Route atlas · {travelMap.stats?.countries ?? travelMap.countries.length} countries
					</motion.p>
				)}
			</AnimatePresence>

			{/* Departure roll */}
			<AnimatePresence>
				{departureVisible && primaryFlight && (
					<motion.div
						className="absolute left-1/2 top-[14%] -translate-x-1/2 text-center"
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
					>
						<p className="font-kanit text-[0.62rem] uppercase tracking-[0.32em] text-warm-mustard">
							{primaryFlight.callsign} · {aircraft} · wheels up
						</p>
						<p className="mt-1 font-kanit text-[0.52rem] uppercase tracking-[0.22em] text-warm-muted">
							{primaryFlight.label}
						</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Live flight ticker — intro only */}
			<AnimatePresence>
				{contentVisible && flights.length > 0 && (
					<motion.div
						className="absolute inset-x-0 top-[10.5rem] z-30 flex justify-center px-4"
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7 }}
					>
						<div className="deck-ticker flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-warm-mustard/25 bg-black/45 px-5 py-2.5 backdrop-blur-md">
							{flights.map((f) => (
								<span
									key={f.id}
									className="font-kanit text-[0.62rem] uppercase tracking-[0.18em] text-warm-light/85"
								>
									<span className="text-warm-mustard">{f.callsign}</span>
									<span className="mx-1 text-warm-muted/40">{f.aircraft}</span>
									<span className="mx-2 text-warm-muted/50">·</span>
									{f.label}
									<span className="ml-2 text-warm-terracotta/80">
										{Math.round(f.progress * 100)}%
									</span>
								</span>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Explorer reveal — pilot narrative */}
			<AnimatePresence>
				{contentVisible && (
					<motion.div
						className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-warm-dark via-warm-dark/85 to-transparent px-6 pb-8 pt-24 md:px-10 md:pb-10 md:pl-[min(22rem,38vw)]"
						initial={{ opacity: 0, y: 32 }}
						animate={{ opacity: revealVisible ? 1 : 0.7, y: 0 }}
						transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
					>
						<p className="font-kanit text-[0.6rem] font-medium uppercase tracking-[0.36em] text-warm-terracotta">
							{branding.siteName} · {travelMap.title}
						</p>
						<h1
							className="mt-2 max-w-2xl font-kanit font-black leading-[0.95] tracking-[-1px] text-gradient"
							style={{ fontSize: "clamp(1.75rem, 5.5vw, 3.25rem)" }}
						>
							{opening?.reveal ?? travelMap.subtitle}
						</h1>
						<p className="mt-3 max-w-lg font-body text-xs font-light text-warm-muted md:text-sm">
							{opening?.hint ?? "Select a waypoint on the left to descend into each chapter."}
						</p>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
