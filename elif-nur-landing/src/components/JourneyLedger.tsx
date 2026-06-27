import { motion } from "framer-motion";
import {
	Clock,
	Globe2,
	Heart,
	MapPin,
	Plane,
	Route,
	User,
} from "lucide-react";
import { useMemo } from "react";
import type { AirportFlightSummary, TravelMapCity, TravelMapCountry } from "../data/travel-map";
import type { CompanionFilter } from "../utils/companion-filter";
import { countCompanionCities } from "../utils/companion-filter";
import { countContinentsFromIso2 } from "../utils/continents";

type Props = {
	countries: TravelMapCountry[];
	cities: TravelMapCity[];
	visible: boolean;
	companion?: CompanionFilter;
	flightSummary?: Record<string, AirportFlightSummary>;
};

const FILTER_LABEL: Record<Exclude<CompanionFilter, "all">, string> = {
	spouse: "With husband",
	solo: "Solo",
};

function sumFlightStats(
	summary: Record<string, AirportFlightSummary> | undefined,
	cityCodes: Set<string>,
) {
	if (!summary) return null;
	let sectors = 0;
	let blockHrs = 0;
	let airports = 0;
	for (const [iata, row] of Object.entries(summary)) {
		if (cityCodes.size > 0 && !cityCodes.has(iata.toUpperCase())) continue;
		sectors += row.sectors;
		blockHrs += row.blockHrs;
		airports += 1;
	}
	if (!airports) return null;
	return { sectors, blockHrs, airports };
}

export default function JourneyLedger({
	countries,
	cities,
	visible,
	companion = "all",
	flightSummary,
}: Props) {
	const { withSpouse, solo } = countCompanionCities(cities);
	const continentCount = useMemo(
		() => countContinentsFromIso2(countries.map((c) => c.iso2)),
		[countries],
	);
	const favorites = countries.filter((c) => c.favorite).length;
	const layovers = cities.filter((c) => c.role === "layover").length;
	const hubs = cities.filter((c) => c.role === "hub" || c.role === "home").length;

	const cityCodes = useMemo(
		() =>
			new Set(
				cities.map((c) => c.airportCode?.toUpperCase()).filter((c): c is string => Boolean(c)),
			),
		[cities],
	);

	const pilot = useMemo(
		() => sumFlightStats(flightSummary, cityCodes),
		[flightSummary, cityCodes],
	);

	return (
		<motion.aside
			className="pointer-events-none absolute bottom-4 right-4 top-[7.25rem] z-30 hidden w-56 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md md:flex lg:right-6 lg:w-60"
			initial={{ opacity: 0, x: 16 }}
			animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 16 }}
			transition={{ duration: 0.7, delay: 0.25 }}
			aria-label="Journey statistics"
		>
			<div className="shrink-0 border-b border-white/8 px-4 py-3">
				<p className="font-ui text-[0.7rem] font-semibold tracking-wide text-warm-terracotta">
					Flight log
				</p>
				{companion !== "all" ? (
					<p className="mt-0.5 font-ui text-[0.62rem] text-warm-muted">
						{FILTER_LABEL[companion]} only
					</p>
				) : (
					<p className="mt-0.5 font-ui text-[0.62rem] leading-snug text-warm-muted">
						Airline pilot · Qatar Airways
					</p>
				)}
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
				<p className="font-ui text-[0.58rem] font-medium uppercase tracking-[0.12em] text-warm-muted/90">
					Journey map
				</p>
				<ul className="mt-2 space-y-2.5">
					<Row icon={Globe2} label="Countries" value={countries.length} />
					{continentCount != null && continentCount > 0 && (
						<Row icon={Globe2} label="Continents" value={continentCount} muted />
					)}
					<Row icon={MapPin} label="Cities" value={cities.length} />
					<Row icon={Heart} label="With husband" value={withSpouse} accent="text-warm-mustard" />
					<Row icon={User} label="Solo" value={solo} accent="text-warm-sage" />
					{favorites > 0 && (
						<Row icon={Plane} label="Favourite nations" value={favorites} accent="text-warm-mustard/90" />
					)}
				</ul>

				{pilot && (
					<>
						<p className="mt-4 font-ui text-[0.58rem] font-medium uppercase tracking-[0.12em] text-warm-muted/90">
							Pilot log
						</p>
						<ul className="mt-2 space-y-2.5">
							<Row icon={Route} label="Sectors" value={pilot.sectors} accent="text-warm-light" />
							<Row
								icon={Clock}
								label="Block hours"
								value={pilot.blockHrs}
								format="decimal"
								accent="text-warm-light"
							/>
							<Row icon={Plane} label="Airports" value={pilot.airports} muted />
						</ul>
					</>
				)}

				{(layovers > 0 || hubs > 0) && (
					<ul className="mt-4 space-y-2 border-t border-white/8 pt-3">
						{hubs > 0 && <Row icon={MapPin} label="Hub & origin" value={hubs} muted small />}
						{layovers > 0 && (
							<Row icon={Plane} label="Layovers" value={layovers} muted small />
						)}
					</ul>
				)}
			</div>

			<div className="shrink-0 border-t border-white/8 px-4 py-3">
				<p className="font-ui text-[0.58rem] font-medium text-warm-muted">Waypoint key</p>
				<ul className="mt-2 space-y-1.5 font-ui text-[0.62rem] text-warm-muted">
					<li className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[#F5EDE4]" />
						With husband
					</li>
					<li className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[#85B8CB]" />
						Solo
					</li>
					<li className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[#C25B3F]" />
						Origin
					</li>
				</ul>
			</div>
		</motion.aside>
	);
}

function Row({
	icon: Icon,
	label,
	value,
	accent = "text-warm-light",
	muted = false,
	small = false,
	format = "int",
}: {
	icon: typeof Globe2;
	label: string;
	value: number;
	accent?: string;
	muted?: boolean;
	small?: boolean;
	format?: "int" | "decimal";
}) {
	const display =
		format === "decimal"
			? value.toLocaleString("en-US", { maximumFractionDigits: 1 })
			: value.toLocaleString("en-US");

	return (
		<li className="flex items-center justify-between gap-2">
			<span
				className={`flex items-center gap-2 font-ui ${small ? "text-[0.6rem]" : "text-[0.65rem]"} ${
					muted ? "text-warm-muted/85" : "text-warm-muted"
				}`}
			>
				<Icon className="h-3.5 w-3.5 shrink-0 text-warm-terracotta/75" strokeWidth={1.5} />
				{label}
			</span>
			<span
				className={`font-ui tabular-nums ${small ? "text-xs" : "text-sm"} font-semibold ${
					muted ? "text-warm-muted" : accent
				}`}
			>
				{display}
			</span>
		</li>
	);
}
