import { motion, type MotionProps } from "framer-motion";
import type { ReactNode } from "react";

type FadeInProps = {
	children: ReactNode;
	delay?: number;
	x?: number;
	y?: number;
	duration?: number;
	className?: string;
} & Pick<MotionProps, "viewport">;

/** Stagger-friendly entrance animation wrapper. */
export default function FadeIn({
	children,
	delay = 0,
	x = 0,
	y = 24,
	duration = 0.8,
	className,
	viewport = { once: true, margin: "-80px" },
}: FadeInProps) {
	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, x, y }}
			whileInView={{ opacity: 1, x: 0, y: 0 }}
			viewport={viewport}
			transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
			style={{ willChange: "transform, opacity" }}
		>
			{children}
		</motion.div>
	);
}
