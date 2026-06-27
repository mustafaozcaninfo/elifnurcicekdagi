import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Heart, Home, MapPin, Search, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TravelMapCity, TravelMapCountry } from "../data/travel-map";
import { cityLabel, roleBadge, visitBadge } from "../data/travel-map";
import { useIsMobile } from "../hooks/useIsMobile";
import { isWithSpouse } from "../utils/companion-filter";

type Props = {
	cities: TravelMapCity[];
	countries: TravelMapCountry[];
	selectedId: string | null;
	visible: boolean;
	onSelect: (city: TravelMapCity) => void;
	onOpenChange?: (open: boolean) => void;
};

const PRIORITY_ISO = ["QA", "TR"];

function sortCountries(a: TravelMapCountry, b: TravelMapCountry): number {
	const pa = PRIORITY_ISO.indexOf(a.iso2);
	const pb = PRIORITY_ISO.indexOf(b.iso2);
	if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
	if (a.favorite && !b.favorite) return -1;
	if (!a.favorite && b.favorite) return 1;
	return a.name.localeCompare(b.name);
}

function CityIcon({ city }: { city: TravelMapCity }) {
	if (city.role === "home") {
		return <Home className="h-3 w-3 shrink-0 text-warm-terracotta" strokeWidth={1.5} />;
	}
	if (isWithSpouse(city)) {
		return <Heart className="h-3 w-3 shrink-0 text-warm-mustard" strokeWidth={1.5} />;
	}
	if (city.role !== "home" && city.role !== "hub") {
		return <User className="h-3 w-3 shrink-0 text-warm-sage" strokeWidth={1.5} />;
	}
	return <MapPin className="h-3 w-3 shrink-0 text-warm-muted/70" strokeWidth={1.5} />;
}

function sortCities(a: TravelMapCity, b: TravelMapCity): number {
	const roleOrder = { home: 0, hub: 1, layover: 2, visited: 3 };
	const ra = roleOrder[a.role ?? "visited"];
	const rb = roleOrder[b.role ?? "visited"];
	if (ra !== rb) return ra - rb;
	return a.name.localeCompare(b.name);
}

function defaultCollapsedCountries(countries: TravelMapCountry[], mobile: boolean) {
	if (!mobile) return new Set<string>();
	return new Set(countries.filter((c) => !PRIORITY_ISO.includes(c.iso2)).map((c) => c.iso2));
}

export default function WaypointRail({
	cities,
	countries,
	selectedId,
	visible,
	onSelect,
	onOpenChange,
}: Props) {
	const isMobile = useIsMobile();
	const [railOpen, setRailOpen] = useState(!isMobile);
	const [query, setQuery] = useState("");
	const [collapsed, setCollapsed] = useState<Set<string>>(() =>
		defaultCollapsedCountries(countries, isMobile),
	);

	useEffect(() => {
		setRailOpen(!isMobile);
		setCollapsed(defaultCollapsedCountries(countries, isMobile));
	}, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		onOpenChange?.(railOpen);
	}, [railOpen, onOpenChange]);

	const countryByIso = useMemo(
		() => new Map(countries.map((c) => [c.iso2, c])),
		[countries],
	);

	const groups = useMemo(() => {
		const q = query.trim().toLowerCase();
		const byCountry = new Map<string, TravelMapCity[]>();

		for (const city of cities) {
			if (
				q &&
				!city.name.toLowerCase().includes(q) &&
				!city.countryName?.toLowerCase().includes(q) &&
				!city.airportCode?.toLowerCase().includes(q)
			) {
				continue;
			}
			const list = byCountry.get(city.country) ?? [];
			list.push(city);
			byCountry.set(city.country, list);
		}

		return [...byCountry.entries()]
			.map(([iso, list]) => ({
				country: countryByIso.get(iso) ?? {
					iso2: iso,
					name: list[0]?.countryName ?? iso,
					visited: true,
				},
				cities: [...list].sort(sortCities),
			}))
			.sort((a, b) => sortCountries(a.country, b.country));
	}, [cities, countryByIso, query]);

	const toggleCountry = (iso: string) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(iso)) next.delete(iso);
			else next.add(iso);
			return next;
		});
	};

	const closeRail = () => setRailOpen(false);

	if (!visible) return null;

	const railContent = (
		<>
			<div className="shrink-0 border-b border-white/8 px-4 py-3">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="flex items-center gap-2 font-ui text-[0.72rem] font-semibold text-warm-mustard">
							<MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
							Pick a city
						</p>
						<p className="mt-1 font-ui text-[0.65rem] leading-relaxed text-warm-muted">
							{isMobile
								? "Close to drag the map with two fingers"
								: "Tap a name here — or a dot on the globe"}
						</p>
					</div>
					{isMobile && (
						<button
							type="button"
							onClick={closeRail}
							className="shrink-0 rounded-full border border-white/10 bg-black/40 p-2 text-warm-muted active:bg-white/10"
							aria-label="Close city list"
						>
							<X className="h-4 w-4" strokeWidth={1.5} />
						</button>
					)}
				</div>
			</div>
			<div className="shrink-0 border-b border-white/8 px-3 py-2">
				<label className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/40 px-3 py-2.5">
					<Search className="h-3.5 w-3.5 shrink-0 text-warm-muted" strokeWidth={1.5} />
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search city or country…"
						className="w-full bg-transparent font-ui text-xs text-warm-light outline-none placeholder:text-warm-muted/70"
					/>
				</label>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 touch-pan-y">
				{groups.map(({ country, cities: groupCities }) => {
					const open = !collapsed.has(country.iso2);
					return (
						<div key={country.iso2} className="mb-2">
							<button
								type="button"
								onClick={() => toggleCountry(country.iso2)}
								className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left transition-colors active:bg-white/8"
							>
								<span
									className="h-2.5 w-2.5 shrink-0 rounded-full"
									style={{ background: country.color ?? "#C25B3F" }}
								/>
								<span className="min-w-0 flex-1 font-ui text-xs font-semibold text-warm-light">
									{country.name}
									{country.favorite && (
										<span className="ml-1.5 text-warm-mustard">♥</span>
									)}
								</span>
								<span className="font-ui text-[0.65rem] tabular-nums text-warm-muted">
									{groupCities.length}
								</span>
								<ChevronDown
									className={`h-3.5 w-3.5 text-warm-muted transition-transform ${open ? "rotate-180" : ""}`}
									strokeWidth={1.5}
								/>
							</button>
							{open && (
								<ul className="mt-0.5 space-y-0.5 pl-1">
									{groupCities.map((city) => {
										const active = city.id === selectedId;
										return (
											<li key={city.id}>
												<button
													type="button"
													onClick={() => {
														onSelect(city);
														if (isMobile) closeRail();
													}}
													className={`w-full rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
														active
															? "bg-warm-terracotta/25 ring-1 ring-warm-mustard/40"
															: "active:bg-white/8"
													}`}
												>
													<div className="flex items-center justify-between gap-2">
														<span className="flex items-center gap-2 font-ui text-sm font-medium text-warm-light">
															<CityIcon city={city} />
															{city.name}
														</span>
														<span className="font-ui text-[0.62rem] font-medium tracking-wide text-warm-mustard/90">
															{cityLabel(city)}
														</span>
													</div>
													<div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
														<span className="font-ui text-[0.58rem] font-medium text-warm-terracotta/80">
															{roleBadge(city.role)}
														</span>
														{visitBadge(city) && (
															<span
																className={`font-ui text-[0.58rem] font-medium ${
																	isWithSpouse(city)
																		? "text-warm-mustard"
																		: "text-warm-sage"
																}`}
															>
																{visitBadge(city)}
															</span>
														)}
													</div>
												</button>
											</li>
										);
									})}
								</ul>
							)}
						</div>
					);
				})}
			</div>
		</>
	);

	if (isMobile && !railOpen) {
		return (
			<motion.button
				type="button"
				onClick={() => setRailOpen(true)}
				className="pointer-events-auto fixed left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-warm-mustard/35 bg-[#080604]/92 px-5 py-3 font-ui text-[0.7rem] font-medium text-warm-light shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl active:scale-[0.98]"
				style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35 }}
				aria-label="Open city list"
			>
				<MapPin className="h-4 w-4 text-warm-mustard" strokeWidth={1.5} />
				{cities.length} cities · Browse
				<ChevronUp className="h-3.5 w-3.5 text-warm-muted" strokeWidth={1.5} />
			</motion.button>
		);
	}

	if (isMobile && railOpen) {
		return (
			<>
				<button
					type="button"
					className="pointer-events-auto fixed inset-0 z-30 bg-black/55 backdrop-blur-[2px]"
					aria-label="Close city list backdrop"
					onClick={closeRail}
				/>
				<motion.nav
					className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex max-h-[min(68dvh,calc(100dvh-7.5rem))] flex-col overflow-hidden rounded-t-[1.35rem] border border-white/10 border-b-0 bg-[#080604]/96 shadow-[0_-12px_48px_rgba(0,0,0,0.65)] backdrop-blur-xl"
					style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
					initial={{ y: "100%" }}
					animate={{ y: 0 }}
					transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
					aria-label="Waypoints by country"
				>
					<div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/25" aria-hidden />
					{railContent}
				</motion.nav>
			</>
		);
	}

	return (
		<motion.nav
			className="pointer-events-auto absolute bottom-4 left-4 top-[7.25rem] z-30 flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md md:left-6 lg:w-80"
			initial={{ opacity: 0, x: -24 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
			aria-label="Waypoints by country"
		>
			{railContent}
		</motion.nav>
	);
}
