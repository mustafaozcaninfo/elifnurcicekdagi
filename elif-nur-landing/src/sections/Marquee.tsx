import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MARQUEE_ROW_1, MARQUEE_ROW_2 } from "../data/images";

function MarqueeRow({
	images,
	direction,
}: {
	images: string[];
	direction: "left" | "right";
}) {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	});

	const x = useTransform(
		scrollYProgress,
		[0, 1],
		direction === "right" ? ["-8%", "8%"] : ["8%", "-8%"],
	);

	const doubled = [...images, ...images];

	return (
		<div ref={ref} className="overflow-hidden py-3">
			<motion.div style={{ x, willChange: "transform" }} className="flex w-max gap-5">
				{doubled.map((src, i) => (
					<img
						key={`${src}-${i}`}
						src={src}
						alt=""
						loading="lazy"
						width={420}
						height={270}
						className="h-[200px] w-[320px] shrink-0 rounded-3xl object-cover shadow-gallery sm:h-[240px] sm:w-[380px] md:h-[270px] md:w-[420px]"
					/>
				))}
			</motion.div>
		</div>
	);
}

export default function Marquee() {
	return (
		<section
			id="highlights"
			className="relative overflow-hidden bg-warm-darker bg-texture py-16 md:py-24"
			aria-label="Travel highlights"
		>
			<div className="pointer-events-none absolute inset-0 opacity-30">
				<div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-warm-terracotta/40 to-transparent" />
			</div>
			<MarqueeRow images={MARQUEE_ROW_1} direction="right" />
			<MarqueeRow images={MARQUEE_ROW_2} direction="left" />
		</section>
	);
}
