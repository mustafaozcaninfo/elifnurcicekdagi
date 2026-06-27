import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";

type Props = {
	visible: boolean;
	onClick: () => void;
	bottomOffset?: string;
};

export default function GlobeRecenterButton({ visible, onClick, bottomOffset }: Props) {
	if (!visible) return null;

	return (
		<motion.button
			type="button"
			onClick={onClick}
			className="pointer-events-auto fixed right-4 z-30 flex items-center gap-1.5 rounded-full border border-white/12 bg-[#080604]/90 px-3.5 py-2.5 font-ui text-[0.62rem] font-medium text-warm-light shadow-lg shadow-black/40 backdrop-blur-xl active:scale-[0.97]"
			style={{ bottom: bottomOffset ?? "max(5.75rem, calc(env(safe-area-inset-bottom) + 4.75rem))" }}
			initial={{ opacity: 0, scale: 0.92 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.92 }}
			aria-label="Recenter map"
		>
			<Crosshair className="h-3.5 w-3.5 text-warm-mustard" strokeWidth={1.5} />
			Recenter
		</motion.button>
	);
}
