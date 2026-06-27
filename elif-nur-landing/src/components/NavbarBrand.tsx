import { useIsMobile } from "../hooks/useIsMobile";
import B777LogoMark from "./B777LogoMark";

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

export default function NavbarBrand({
	siteName,
	compact = false,
}: {
	siteName: string;
	compact?: boolean;
}) {
	const isMobile = useIsMobile();
	const isCompact = compact && isMobile;
	const { given, family } = nameParts(siteName);
	const aria = `${fullName(siteName)} — return to journey map`;

	return (
		<a
			href="/"
			className={`group flex min-w-0 items-center transition-opacity hover:opacity-95 ${
				isCompact
					? "max-w-[min(100%,12.5rem)] gap-2"
					: "max-w-[min(100%,16rem)] gap-2.5 sm:max-w-none md:gap-3"
			}`}
			aria-label={aria}
		>
			<span className="relative shrink-0">
				<span
					className={`flex items-center justify-center overflow-hidden rounded-lg border border-warm-mustard/30 bg-gradient-to-b from-[#0c0a08] to-[#050403]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_22px_rgba(212,160,23,0.12)] transition-all group-hover:border-warm-mustard/50 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_28px_rgba(212,160,23,0.22)] md:rounded-xl ${
						isCompact
							? "h-7 w-[2.85rem] px-0.5 py-px"
							: "h-9 w-[3.55rem] px-1 py-0.5 md:h-10 md:w-[4rem] md:px-1.5"
					}`}
				>
					<span
						className={`deck-brand-icon flex w-full items-center justify-center opacity-[0.97] transition-transform duration-300 group-hover:scale-[1.04] ${
							isCompact ? "h-[1.35rem]" : "h-[1.65rem] md:h-[1.85rem]"
						}`}
					>
						<B777LogoMark />
					</span>
				</span>
				<span
					className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#030201] bg-warm-sage deck-blink"
					aria-hidden
				/>
			</span>

			<span className={`min-w-0 leading-none ${isCompact ? "" : "flex flex-col gap-1"}`}>
				<span className="flex min-w-0 items-center gap-1 md:gap-2">
					<span
						className={`truncate font-kanit font-bold uppercase text-warm-light ${
							isCompact
								? "text-[0.62rem] tracking-[0.08em]"
								: "text-[0.68rem] tracking-[0.11em] md:text-[0.92rem] md:tracking-[0.13em]"
						}`}
					>
						<span>{given}</span>
						{!isMobile && family && (
							<span className="text-warm-mustard/85"> {family}</span>
						)}
					</span>
					<span className="shrink-0 rounded border border-warm-mustard/35 bg-warm-mustard/10 px-1 py-px font-ui text-[0.42rem] font-semibold uppercase tracking-[0.16em] text-warm-mustard md:px-1.5 md:text-[0.5rem] md:tracking-[0.18em]">
						B777
					</span>
				</span>

				{!isCompact && (
					<span className="flex min-w-0 items-center gap-1.5 font-ui text-[0.46rem] font-medium uppercase tracking-[0.2em] text-warm-muted md:text-[0.54rem]">
						<span className="shrink-0 text-warm-terracotta/90">ENF·001</span>
						<span className="shrink-0 text-white/15" aria-hidden>
							│
						</span>
						<span className="truncate text-warm-mustard/75">AIRLINE PILOT</span>
					</span>
				)}
			</span>
		</a>
	);
}
