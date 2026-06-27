import { motion } from "framer-motion";
import { Heart, User } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";
import type { CompanionFilter } from "../utils/companion-filter";

type Props = {
	value: CompanionFilter;
	onChange: (next: CompanionFilter) => void;
	visible: boolean;
};

const OPTIONS: { id: CompanionFilter; label: string; icon?: "heart" | "user" }[] = [
	{ id: "all", label: "All" },
	{ id: "spouse", label: "Husband", icon: "heart" },
	{ id: "solo", label: "Solo", icon: "user" },
];

export default function CompanionFilterBar({ value, onChange, visible }: Props) {
	const isMobile = useIsMobile();

	const pills = (
		<div
			className={`flex items-center gap-0.5 rounded-2xl border border-white/12 bg-[#080604]/92 p-0.5 shadow-lg shadow-black/35 backdrop-blur-xl md:gap-1 md:rounded-full md:p-1 ${
				isMobile ? "w-full" : ""
			}`}
		>
			{OPTIONS.map((opt) => {
				const active = value === opt.id;
				return (
					<button
						key={opt.id}
						type="button"
						onClick={() => onChange(opt.id)}
						className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-2.5 font-ui text-[0.62rem] font-medium transition-colors md:flex-none md:rounded-full md:px-3 md:py-1.5 md:text-[0.68rem] ${
							active
								? "bg-warm-mustard/20 text-warm-light"
								: "text-warm-muted active:text-warm-light"
						}`}
						aria-pressed={active}
					>
						{opt.icon === "heart" && (
							<Heart
								className={`h-3 w-3 shrink-0 ${active ? "text-warm-mustard" : "text-warm-mustard/70"}`}
								strokeWidth={1.5}
							/>
						)}
						{opt.icon === "user" && (
							<User
								className={`h-3 w-3 shrink-0 ${active ? "text-warm-sage" : "text-warm-sage/70"}`}
								strokeWidth={1.5}
							/>
						)}
						<span className="truncate">{opt.label}</span>
					</button>
				);
			})}
		</div>
	);

	if (isMobile) {
		return (
			<motion.div
				className="pointer-events-auto fixed inset-x-0 z-40 px-3"
				style={{ top: "calc(max(0.25rem, env(safe-area-inset-top)) + 4.35rem)" }}
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -10 }}
				transition={{ duration: 0.4, delay: 0.1 }}
				role="group"
				aria-label="Journey filter"
			>
				{pills}
			</motion.div>
		);
	}

	return (
		<motion.div
			className="pointer-events-auto absolute left-1/2 top-[4.75rem] z-40 -translate-x-1/2"
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -8 }}
			transition={{ duration: 0.45, delay: 0.15 }}
			role="group"
			aria-label="Journey filter"
		>
			{pills}
		</motion.div>
	);
}
