import { Globe2, MapPin, Plane } from "lucide-react";
import { useState } from "react";
import FadeIn from "../components/FadeIn";
import TravelGlobe from "../components/TravelGlobe";
import type { TravelMapCity } from "../data/travel-map";
import { useSite } from "../hooks/useSite";

export default function Explorer() {
	const { travelMap } = useSite();
	const [selected, setSelected] = useState<TravelMapCity | null>(null);

	const visitedCountries = travelMap.countries.filter((c) => c.visited);

	return (
		<section
			id="explorer"
			className="relative overflow-hidden bg-warm-darker px-6 py-24 md:px-10 md:py-32"
		>
			<div className="pointer-events-none absolute inset-0 bg-texture opacity-60" />

			<div className="relative z-10 mx-auto max-w-7xl">
				<FadeIn>
					<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
						<div>
							<p className="font-kanit text-xs font-medium uppercase tracking-[0.28em] text-warm-terracotta">
								Flight Deck Atlas
							</p>
							<h2
								className="mt-3 font-kanit font-black tracking-tight text-gradient"
								style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
							>
								{travelMap.title}
							</h2>
							<p className="mt-4 max-w-xl font-body text-sm font-light text-warm-muted md:text-base">
								{travelMap.subtitle}
							</p>
						</div>

						<div className="flex gap-6 font-kanit">
							<Stat
								icon={Globe2}
								value={travelMap.stats?.countries ?? visitedCountries.length}
								label="Countries"
							/>
							<Stat
								icon={MapPin}
								value={travelMap.stats?.cities ?? travelMap.cities.length}
								label="Cities"
							/>
							{travelMap.homeHub && (
								<Stat icon={Plane} value={travelMap.homeHub.code} label="Home hub" />
							)}
						</div>
					</div>
				</FadeIn>

				<FadeIn delay={0.15} className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
					<TravelGlobe
						data={travelMap}
						selectedId={selected?.id ?? null}
						onSelect={setSelected}
					/>

					<aside className="flex flex-col gap-6">
						<div className="admin-card rounded-2xl border border-white/10 bg-warm-dark/60 p-6 backdrop-blur-sm">
							<h3 className="font-kanit text-sm font-semibold uppercase tracking-wider text-warm-light">
								Visited Countries
							</h3>
							<ul className="mt-4 space-y-2">
								{visitedCountries.map((c) => (
									<li
										key={c.iso2}
										className="flex items-center gap-3 font-body text-sm text-warm-light/90"
									>
										<span
											className="h-2.5 w-2.5 rounded-full"
											style={{ background: c.color ?? "#C25B3F" }}
										/>
										<span className="font-medium">{c.name}</span>
										<span className="text-warm-muted">{c.iso2}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="admin-card rounded-2xl border border-white/10 bg-warm-dark/60 p-6 backdrop-blur-sm">
							<h3 className="font-kanit text-sm font-semibold uppercase tracking-wider text-warm-light">
								Cities
							</h3>
							<ul className="mt-4 space-y-1">
								{travelMap.cities.map((city) => (
									<li key={city.id}>
										<button
											type="button"
											onClick={() => setSelected(city)}
											className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
												selected?.id === city.id
													? "bg-warm-terracotta/20 text-warm-light"
													: "text-warm-muted hover:bg-white/5 hover:text-warm-light"
											}`}
										>
											<span className="font-kanit font-medium">{city.name}</span>
											<span className="ml-2 text-xs uppercase text-warm-muted">
												{city.countryName ?? city.country}
											</span>
											{city.note && (
												<p className="mt-0.5 font-body text-xs text-warm-muted/80">
													{city.note}
												</p>
											)}
										</button>
									</li>
								))}
							</ul>
						</div>

						{selected && (
							<div className="rounded-2xl border border-warm-terracotta/30 bg-warm-terracotta/10 p-5">
								<p className="font-kanit text-lg font-semibold text-warm-light">
									{selected.name}
								</p>
								<p className="mt-1 text-sm text-warm-muted">
									{selected.countryName ?? selected.country}
									{selected.role ? ` · ${selected.role}` : ""}
								</p>
								{selected.note && (
									<p className="mt-2 font-body text-sm text-warm-light/80">{selected.note}</p>
								)}
							</div>
						)}
					</aside>
				</FadeIn>
			</div>
		</section>
	);
}

function Stat({
	icon: Icon,
	value,
	label,
}: {
	icon: typeof Globe2;
	value: string | number;
	label: string;
}) {
	return (
		<div className="text-center md:text-right">
			<Icon className="mx-auto mb-1 h-5 w-5 text-warm-terracotta md:ml-auto" strokeWidth={1.5} />
			<p className="text-2xl font-semibold text-warm-light">{value}</p>
			<p className="text-[0.65rem] uppercase tracking-wider text-warm-muted">{label}</p>
		</div>
	);
}
