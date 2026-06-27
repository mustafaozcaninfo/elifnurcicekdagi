import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { JourneyCard } from "../data/images";
import FadeIn from "../components/FadeIn";
import ViewGalleryButton from "../components/ViewGalleryButton";
import { useSite } from "../hooks/useSite";

function JourneyCardView({ journey, index }: { journey: JourneyCard; index: number }) {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	});

	const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1 - index * 0.04, 1 - index * 0.06]);
	const y = useTransform(scrollYProgress, [0, 1], [index * 40, -index * 20]);

	return (
		<div
			ref={ref}
			className="sticky top-[calc(4rem+var(--card-offset))]"
			style={{ "--card-offset": `${index * 1.5}rem` } as React.CSSProperties}
		>
			<motion.article
				style={{ scale, y, willChange: "transform" }}
				className="mx-auto mb-16 max-w-6xl overflow-hidden rounded-[2rem] border border-white/8 bg-warm-darker/90 shadow-gallery backdrop-blur-sm md:mb-24 md:rounded-[2.5rem]"
			>
				<div className="flex flex-col gap-6 border-b border-white/5 p-8 md:flex-row md:items-end md:justify-between md:p-10">
					<div>
						<p className="font-kanit text-sm font-medium uppercase tracking-[0.25em] text-warm-terracotta">
							{journey.number} · {journey.category}
						</p>
						<h3
							className="mt-2 font-kanit font-bold text-warm-light"
							style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
						>
							{journey.title}
						</h3>
						<p className="mt-1 font-body text-sm text-warm-muted">{journey.location}</p>
					</div>
					<ViewGalleryButton />
				</div>

				<div className="grid gap-4 p-6 md:grid-cols-2 md:gap-5 md:p-8">
					<div className="flex flex-col gap-4 md:gap-5">
						<img
							src={journey.images.topLeft}
							alt={`${journey.title} — view 1`}
							loading="lazy"
							className="h-48 w-full rounded-2xl object-cover md:h-56"
						/>
						<img
							src={journey.images.bottomLeft}
							alt={`${journey.title} — view 2`}
							loading="lazy"
							className="h-48 w-full rounded-2xl object-cover md:h-56"
						/>
					</div>
					<img
						src={journey.images.tallRight}
						alt={`${journey.title} — featured`}
						loading="lazy"
						className="h-full min-h-[280px] w-full rounded-2xl object-cover md:min-h-[480px]"
					/>
				</div>
			</motion.article>
		</div>
	);
}

export default function Journeys() {
	const { journeys } = useSite();

	return (
		<section
			id="journeys"
			className="relative -mt-8 rounded-t-[3rem] bg-warm-dark px-6 pb-32 pt-24 md:-mt-12 md:rounded-t-[4rem] md:px-10 md:pt-32"
		>
			<div className="mx-auto max-w-6xl">
				<FadeIn>
					<h2
						className="text-center font-kanit font-black tracking-tight text-gradient"
						style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
					>
						Journeys
					</h2>
				</FadeIn>

				<div
					className="relative mt-16 md:mt-24"
					style={{ minHeight: `${journeys.length * 85}vh` }}
				>
					{journeys.map((journey, i) => (
						<JourneyCardView key={journey.title} journey={journey} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
