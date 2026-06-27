import { motion } from "framer-motion";
import { Hand, MousePointerClick, Move, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

type Props = {
	visible: boolean;
	onSkip?: () => void;
	showSkip?: boolean;
};

export default function ExploreChrome({ visible, onSkip, showSkip }: Props) {
	const isMobile = useIsMobile();
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		if (!visible) setDismissed(false);
	}, [visible]);

	useEffect(() => {
		if (!visible || dismissed) return;
		const t = window.setTimeout(() => setDismissed(true), isMobile ? 6000 : 9000);
		return () => clearTimeout(t);
	}, [visible, dismissed, isMobile]);

	const showHints = visible && !dismissed && !isMobile;

	return (
		<>
			{showSkip && onSkip && (
				<motion.button
					type="button"
					onClick={onSkip}
					className="pointer-events-auto absolute left-1/2 top-[4.5rem] z-40 -translate-x-1/2 rounded-full border border-white/15 bg-black/80 px-4 py-2 font-ui text-[0.68rem] font-medium text-warm-light transition-colors active:border-warm-mustard/40 active:bg-black/90 md:top-20"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
				>
					Skip intro
				</motion.button>
			)}

			<motion.div
				className={`pointer-events-none absolute inset-x-0 z-20 flex justify-center px-3 ${
					isMobile ? "bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))]" : "bottom-28"
				}`}
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: showHints ? 1 : 0, y: showHints ? 0 : 12 }}
				transition={{ duration: 0.4 }}
			>
				<div className="flex max-w-lg flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-black/75 px-4 py-3 md:bg-black/60 md:backdrop-blur-md">
					{isMobile ? (
						<>
							<Hint icon={Hand} text="One finger · rotate" />
							<Hint icon={ZoomIn} text="Pinch · zoom" />
							<Hint icon={Move} text="Two fingers · pan" />
							<Hint icon={MousePointerClick} text="Tap a dot on the map" />
						</>
					) : (
						<>
							<Hint icon={Move} text="Drag to rotate" />
							<Hint icon={ZoomIn} text="Scroll to zoom" />
							<Hint icon={MousePointerClick} text="Click a dot or pick from the list" />
						</>
					)}
				</div>
			</motion.div>
		</>
	);
}

function Hint({ icon: Icon, text }: { icon: typeof Move; text: string }) {
	return (
		<span className="flex items-center gap-1.5 font-ui text-[0.56rem] text-warm-light/85">
			<Icon className="h-3.5 w-3.5 text-warm-mustard" strokeWidth={1.5} />
			{text}
		</span>
	);
}
