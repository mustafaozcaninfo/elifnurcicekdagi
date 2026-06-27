import { useCallback, useRef, type ReactNode } from "react";

type MagnetProps = {
	children: ReactNode;
	strength?: number;
	padding?: number;
	className?: string;
};

/** Mouse-following magnetic hover effect for hero portrait. */
export default function Magnet({
	children,
	strength = 3.5,
	padding = 150,
	className,
}: MagnetProps) {
	const ref = useRef<HTMLDivElement>(null);

	const onMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const el = ref.current;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = (e.clientX - cx) / (rect.width / 2 + padding);
			const dy = (e.clientY - cy) / (rect.height / 2 + padding);
			el.style.transform = `translate3d(${dx * strength * 12}px, ${dy * strength * 12}px, 0)`;
		},
		[strength, padding],
	);

	const onLeave = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		el.style.transform = "translate3d(0, 0, 0)";
	}, []);

	return (
		<div
			className={className}
			onMouseMove={onMove}
			onMouseLeave={onLeave}
			style={{ willChange: "transform" }}
		>
			<div
				ref={ref}
				className="transition-transform duration-300 ease-out"
				style={{ willChange: "transform" }}
			>
				{children}
			</div>
		</div>
	);
}
