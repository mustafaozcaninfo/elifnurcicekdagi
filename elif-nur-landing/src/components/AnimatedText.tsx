import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo, useRef } from "react";

type AnimatedTextProps = {
	text: string;
	className?: string;
};

/** Character-by-character scroll-driven opacity reveal. */
export default function AnimatedText({ text, className }: AnimatedTextProps) {
	const ref = useRef<HTMLParagraphElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start 0.9", "start 0.35"],
	});

	const chars = useMemo(() => text.split(""), [text]);

	return (
		<p
			ref={ref}
			className={`font-body font-light leading-relaxed tracking-wide text-warm-light/90 ${className ?? ""}`}
			aria-label={text}
		>
			{chars.map((char, i) => (
				<Char key={`${char}-${i}`} progress={scrollYProgress} index={i} total={chars.length}>
					{char}
				</Char>
			))}
		</p>
	);
}

function Char({
	children,
	progress,
	index,
	total,
}: {
	children: string;
	progress: ReturnType<typeof useScroll>["scrollYProgress"];
	index: number;
	total: number;
}) {
	const start = index / total;
	const end = Math.min(1, start + 1 / total + 0.02);
	const opacity = useTransform(progress, [start, end], [0.15, 1]);

	return (
		<motion.span style={{ opacity, willChange: "opacity" }} className="inline">
			{children === " " ? "\u00A0" : children}
		</motion.span>
	);
}
