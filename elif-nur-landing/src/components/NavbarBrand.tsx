import { useIsMobile } from "../hooks/useIsMobile";
import { BOEING_777_COMPACT } from "./svg/boeing777";

function fullName(siteName: string): string {
	if (siteName.includes("Özcan") || siteName.includes("Çiçekdağı")) return siteName;
	return `${siteName} Çiçekdağı Özcan`;
}

/** Split for cockpit display: given + family */
function nameParts(siteName: string) {
	const full = fullName(siteName);
	const parts = full.split(/\s+/);
	if (parts.length <= 2) {
		return { given: full, family: "" };
	}
	return {
		given: parts.slice(0, 2).join(" "),
		family: parts.slice(2).join(" "),
	};
}

export default function NavbarBrand({ siteName }: { siteName: string }) {
	const isMobile = useIsMobile();
	const { given, family } = nameParts(siteName);
	const aria = `${fullName(siteName)} — return to journey map`;

	return (
		<a
			href="/"
			className="group flex min-w-0 max-w-[min(100%,14.5rem)] items-center gap-2.5 transition-opacity hover:opacity-95 sm:max-w-none md:gap-3"
			aria-label={aria}
		>
			<span className="relative shrink-0">
				<span className="flex h-9 w-9 items-center justify-center rounded-lg border border-warm-mustard/30 bg-[#080604]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_22px_rgba(212,160,23,0.12)] transition-all group-hover:border-warm-mustard/50 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_28px_rgba(212,160,23,0.22)] md:h-10 md:w-10 md:rounded-xl">
					<span
						className="deck-brand-icon flex h-[1.35rem] w-[1.35rem] items-center justify-center opacity-95 transition-transform duration-300 group-hover:scale-110 md:h-6 md:w-6"
						dangerouslySetInnerHTML={{ __html: BOEING_777_COMPACT }}
						aria-hidden
					/>
				</span>
				<span
					className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#030201] bg-warm-sage deck-blink"
					aria-hidden
				/>
			</span>

			<span className="min-w-0 flex flex-col gap-1 leading-none">
				<span className="flex min-w-0 items-center gap-1.5 md:gap-2">
					<span className="truncate font-kanit text-[0.68rem] font-bold uppercase tracking-[0.11em] text-warm-light md:text-[0.92rem] md:tracking-[0.13em]">
						<span>{given}</span>
						{!isMobile && family && (
							<span className="text-warm-mustard/85"> {family}</span>
						)}
					</span>
					<span className="shrink-0 rounded border border-warm-mustard/35 bg-warm-mustard/10 px-1.5 py-px font-ui text-[0.46rem] font-semibold uppercase tracking-[0.18em] text-warm-mustard md:text-[0.5rem]">
						B777
					</span>
				</span>

				<span className="flex min-w-0 items-center gap-1.5 font-ui text-[0.46rem] font-medium uppercase tracking-[0.2em] text-warm-muted md:text-[0.54rem]">
					<span className="shrink-0 text-warm-terracotta/90">ENF·001</span>
					<span className="shrink-0 text-white/15" aria-hidden>
						│
					</span>
					<span className="truncate text-warm-mustard/75">
						{isMobile ? "Triple seven · Commander" : "Boeing 777 · Airline commander"}
					</span>
				</span>
			</span>
		</a>
	);
}
