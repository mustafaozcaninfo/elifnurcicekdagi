import FadeIn from "../components/FadeIn";
import { useSite } from "../hooks/useSite";

export default function Experiences() {
	const { experiences } = useSite();

	return (
		<section
			id="experiences"
			className="rounded-t-[3rem] bg-warm-cream px-6 py-24 text-warm-dark md:rounded-t-[4rem] md:px-10 md:py-32"
		>
			<div className="mx-auto max-w-5xl">
				<FadeIn>
					<h2
						className="font-kanit font-black tracking-tight text-warm-dark"
						style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)" }}
					>
						Experiences
					</h2>
				</FadeIn>

				<ul className="mt-14 space-y-0 md:mt-20">
					{experiences.map((item, i) => (
						<FadeIn key={item.num} delay={i * 0.08}>
							<li className="grid grid-cols-[auto_1fr] gap-6 border-b border-warm-dark/10 py-10 md:gap-12 md:py-12">
								<span
									className="font-kanit font-black text-warm-terracotta/70"
									style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
								>
									{item.num}
								</span>
								<div>
									<h3
										className="font-kanit font-semibold text-warm-dark"
										style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
									>
										{item.title}
									</h3>
									<p className="mt-3 max-w-xl font-body text-sm font-light leading-relaxed text-warm-muted md:text-base">
										{item.desc}
									</p>
								</div>
							</li>
						</FadeIn>
					))}
				</ul>
			</div>
		</section>
	);
}
