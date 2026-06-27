export type TravelFlight = {
	id: number;
	flightNumber: string;
	fromIata: string;
	toIata: string;
	blockHrs?: number;
	acReg?: string;
	sortOrder: number;
	createdAt: string;
};

export type FlightInput = {
	flightNumber: string;
	fromIata: string;
	toIata: string;
	blockHrs?: number;
	acReg?: string;
};

export type AirportFlightSummary = {
	sectors: number;
	blockHrs: number;
	flights: string[];
};

type FlightRow = {
	id: number;
	flight_number: string;
	from_iata: string;
	to_iata: string;
	block_hrs: number | null;
	ac_reg: string | null;
	sort_order: number;
	created_at: string;
};

function rowToFlight(row: FlightRow): TravelFlight {
	const flight: TravelFlight = {
		id: row.id,
		flightNumber: row.flight_number,
		fromIata: row.from_iata,
		toIata: row.to_iata,
		sortOrder: row.sort_order,
		createdAt: row.created_at,
	};
	if (row.block_hrs != null) flight.blockHrs = row.block_hrs;
	if (row.ac_reg) flight.acReg = row.ac_reg;
	return flight;
}

export async function listFlights(
	db: D1Database,
	filters?: { airport?: string },
): Promise<TravelFlight[]> {
	const airport = filters?.airport?.toUpperCase();
	const rows = airport
		? (
				await db
					.prepare(
						"SELECT * FROM travel_flights WHERE from_iata = ? OR to_iata = ? ORDER BY sort_order, id",
					)
					.bind(airport, airport)
					.all<FlightRow>()
			).results
		: (await db.prepare("SELECT * FROM travel_flights ORDER BY sort_order, id").all<FlightRow>())
				.results;
	return rows.map(rowToFlight);
}

export async function getFlightSummaryByAirport(
	db: D1Database,
): Promise<Map<string, AirportFlightSummary>> {
	const flights = await listFlights(db);
	const acc = new Map<
		string,
		{ sectors: number; blockHrs: number; flights: Set<string> }
	>();

	for (const flight of flights) {
		const block = flight.blockHrs ?? 0;
		for (const iata of [flight.fromIata, flight.toIata]) {
			const entry = acc.get(iata) ?? { sectors: 0, blockHrs: 0, flights: new Set<string>() };
			entry.sectors += 1;
			entry.blockHrs += block;
			entry.flights.add(flight.flightNumber);
			acc.set(iata, entry);
		}
	}

	const summary = new Map<string, AirportFlightSummary>();
	for (const [iata, data] of acc) {
		summary.set(iata, {
			sectors: data.sectors,
			blockHrs: data.blockHrs,
			flights: [...data.flights].sort(),
		});
	}
	return summary;
}

export async function insertFlight(db: D1Database, flight: FlightInput): Promise<number> {
	const sortOrder =
		((
			await db
				.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM travel_flights")
				.first<{ next: number }>()
		)?.next ?? 0);

	const result = await db
		.prepare(
			`INSERT INTO travel_flights (flight_number, from_iata, to_iata, block_hrs, ac_reg, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			flight.flightNumber.trim(),
			flight.fromIata.toUpperCase(),
			flight.toIata.toUpperCase(),
			flight.blockHrs ?? null,
			flight.acReg ?? null,
			sortOrder,
		)
		.run();

	return Number(result.meta.last_row_id);
}

export async function deleteFlight(db: D1Database, id: number): Promise<boolean> {
	const result = await db.prepare("DELETE FROM travel_flights WHERE id = ?").bind(id).run();
	return (result.meta.changes ?? 0) > 0;
}

export async function replaceAllFlights(db: D1Database, flights: FlightInput[]): Promise<number> {
	const stmts: D1PreparedStatement[] = [db.prepare("DELETE FROM travel_flights")];
	flights.forEach((flight, i) => {
		stmts.push(
			db
				.prepare(
					`INSERT INTO travel_flights (flight_number, from_iata, to_iata, block_hrs, ac_reg, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
				)
				.bind(
					flight.flightNumber.trim(),
					flight.fromIata.toUpperCase(),
					flight.toIata.toUpperCase(),
					flight.blockHrs ?? null,
					flight.acReg ?? null,
					i,
				),
		);
	});
	await db.batch(stmts);
	return flights.length;
}

export async function countFlights(db: D1Database): Promise<number> {
	const row = await db
		.prepare("SELECT COUNT(*) AS n FROM travel_flights")
		.first<{ n: number }>();
	return row?.n ?? 0;
}
