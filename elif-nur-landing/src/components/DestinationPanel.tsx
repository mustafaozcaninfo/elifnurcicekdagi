import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import ContactButton from "./ContactButton";
import type { AirportFlightSummary, TravelMapCity, TravelMapCountry } from "../data/travel-map";
import { cityLabel, roleBadge, visitBadge } from "../data/travel-map";

type Props = {
	city: TravelMapCity | null;
	countries: TravelMapCountry[];
	siblingCities: TravelMapCity[];
	flightSummary?: Record<string, AirportFlightSummary>;
	open: boolean;
	onClose: () => void;
	onSelectCity: (city: TravelMapCity) => void;
};

const SECTION_ACCENT: Record<string, string> = {
	about: "text-warm-terracotta",
	experience: "text-warm-mustard",
	journey: "text-warm-sage",
	note: "text-warm-muted",
};

export default function DestinationPanel({
	city,
	countries,
	siblingCities,
	flightSummary,
	open,
	onClose,
	onSelectCity,
}: Props) {
	const country = city ? countries.find((c) => c.iso2 === city.country) : null;
	const iata = city?.airportCode?.toUpperCase();
	const pilotLog = iata && flightSummary ? flightSummary[iata] : undefined;

	return (
		<AnimatePresence>
			{open && city && (
				<>
					<motion.button
						type="button"
						className="pointer-events-auto fixed inset-0 z-40 bg-black/55 md:bg-black/50 md:backdrop-blur-[2px]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						aria-label="Close destination panel"
					/>
					<motion.aside
						className="pointer-events-auto fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-warm-dark/98 shadow-2xl md:bg-warm-dark/95 md:backdrop-blur-xl"
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 28, stiffness: 260 }}
						role="dialog"
						aria-labelledby="destination-title"
					>
						<header className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
							<div className="min-w-0">
								<p className="font-kanit text-[0.6rem] uppercase tracking-[0.32em] text-warm-terracotta">
									{city.story?.tag ?? roleBadge(city.role)}
								</p>
								<h2
									id="destination-title"
									className="mt-1 font-kanit text-2xl font-bold text-warm-light"
								>
									{city.name}
								</h2>
								<p className="mt-0.5 font-kanit text-xs uppercase tracking-widest text-warm-muted">
									{cityLabel(city)} · {city.countryName ?? city.country}
									{visitBadge(city) ? ` · ${visitBadge(city)}` : ""}
								</p>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="shrink-0 rounded-full border border-white/10 p-2 text-warm-muted transition-colors hover:border-white/25 hover:text-warm-light"
								aria-label="Close"
							>
								<X className="h-4 w-4" strokeWidth={1.5} />
							</button>
						</header>

						<div className="flex-1 overflow-y-auto px-6 py-6">
							{pilotLog && (
								<div className="mb-6 rounded-xl border border-warm-mustard/25 bg-warm-mustard/8 p-4">
									<p className="font-kanit text-[0.55rem] uppercase tracking-[0.28em] text-warm-mustard">
										Pilot log · {iata}
									</p>
									<p className="mt-2 font-kanit text-sm text-warm-light">
										{pilotLog.sectors} sectors · {pilotLog.blockHrs.toFixed(1)} block hours
									</p>
									<p className="mt-2 font-mono text-xs leading-relaxed text-warm-muted">
										{pilotLog.flights.join(" · ")}
									</p>
								</div>
							)}

							{country?.narrative && (
								<div
									className="mb-6 rounded-xl border border-white/8 p-4"
									style={{
										borderLeftWidth: 3,
										borderLeftColor: country.color ?? "#C25B3F",
									}}
								>
									<p className="font-kanit text-[0.55rem] uppercase tracking-[0.28em] text-warm-mustard">
										{country.narrative.tag}
										{country.favorite ? " · ♥" : ""}
									</p>
									<p className="mt-2 font-kanit text-sm font-semibold text-warm-light">
										{country.narrative.headline}
									</p>
									<p className="mt-2 font-body text-xs font-light leading-relaxed text-warm-muted">
										{country.narrative.body}
									</p>
								</div>
							)}

							{siblingCities.length > 1 && (
								<div className="mb-6">
									<p className="font-kanit text-[0.55rem] uppercase tracking-[0.28em] text-warm-muted">
										Also in {city.countryName}
									</p>
									<div className="mt-2 flex flex-wrap gap-2">
										{siblingCities.map((s) => (
											<button
												key={s.id}
												type="button"
												onClick={() => onSelectCity(s)}
												className={`rounded-full border px-3 py-1 font-kanit text-[0.62rem] uppercase tracking-wider transition-colors ${
													s.id === city.id
														? "border-warm-mustard/50 bg-warm-mustard/15 text-warm-light"
														: "border-white/10 text-warm-muted hover:border-white/25 hover:text-warm-light"
												}`}
											>
												{s.name}
												{visitBadge(s) === "♥" ? " ♥" : ""}
											</button>
										))}
									</div>
								</div>
							)}

							{city.story?.portraitUrl && (
								<div className="mb-6 overflow-hidden rounded-2xl ring-1 ring-white/10">
									<img
										src={city.story.portraitUrl}
										alt=""
										className="aspect-[4/5] w-full object-cover object-top"
										loading="lazy"
									/>
								</div>
							)}

							{city.story ? (
								<>
									<h3 className="font-kanit text-3xl font-black leading-tight tracking-tight text-gradient">
										{city.story.headline}
									</h3>
									{city.story.lead && (
										<p className="mt-3 font-kanit text-sm font-light leading-relaxed text-warm-light/85">
											{city.story.lead}
										</p>
									)}

									{city.story.sections?.map((section, i) => (
										<article key={i} className="mt-8 border-t border-white/6 pt-6">
											<p
												className={`font-kanit text-[0.58rem] uppercase tracking-[0.28em] ${SECTION_ACCENT[section.type] ?? "text-warm-muted"}`}
											>
												{section.type}
											</p>
											<h4 className="mt-2 font-kanit text-lg font-semibold text-warm-light">
												{section.title}
											</h4>
											{section.imageUrl && (
												<img
													src={section.imageUrl}
													alt=""
													className="mt-4 aspect-video w-full rounded-xl object-cover ring-1 ring-white/10"
													loading="lazy"
												/>
											)}
											{section.body && (
												<p className="mt-3 font-body text-sm font-light leading-relaxed text-warm-muted">
													{section.body}
												</p>
											)}
										</article>
									))}
								</>
							) : (
								<p className="font-body text-sm text-warm-muted">
									{city.note ?? "Story coming soon for this waypoint."}
								</p>
							)}
						</div>

						{city.story?.showContact && (
							<footer className="border-t border-white/8 px-6 py-5">
								<ContactButton className="w-full justify-center" />
							</footer>
						)}
					</motion.aside>
				</>
			)}
		</AnimatePresence>
	);
}
