import FadeIn from "../components/FadeIn";
import Magnet from "../components/Magnet";
import ContactButton from "../components/ContactButton";
import Navbar from "../components/Navbar";
import { useSite } from "../hooks/useSite";

export default function Hero() {
	const { hero } = useSite();

	return (
		<section
			id="hero"
			className="relative flex min-h-screen flex-col overflow-hidden bg-warm-dark bg-texture"
		>
			<Navbar />

			<div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-28 md:px-10">
				<FadeIn delay={0.2} y={40} duration={1}>
					<h1
						className="text-center font-kanit font-black leading-none tracking-[-3px] text-gradient"
						style={{ fontSize: "clamp(3.5rem, 16.5vw, 12rem)" }}
					>
						{hero.heading}
					</h1>
				</FadeIn>

				<FadeIn delay={0.45} y={20} duration={0.9}>
					<p className="mt-6 max-w-md text-center font-kanit text-base font-light tracking-wide text-warm-light/85 md:text-lg">
						{hero.tagline}
					</p>
				</FadeIn>

				<FadeIn delay={0.65} y={30} duration={1} className="mt-10 md:mt-12">
					<Magnet strength={3.5} padding={150} className="mx-auto">
						<div className="relative h-[min(52vh,520px)] w-[min(72vw,380px)] overflow-hidden rounded-[2rem] shadow-gallery ring-1 ring-white/10 md:h-[min(58vh,580px)] md:w-[min(42vw,420px)]">
							<img
								src={hero.portraitUrl}
								alt="Elif Nur Çiçekdağı Özcan — portrait"
								className="h-full w-full object-cover object-top"
								loading="eager"
								fetchPriority="high"
								width={420}
								height={580}
							/>
							<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-warm-dark/50 via-transparent to-transparent" />
						</div>
					</Magnet>
				</FadeIn>
			</div>

			<FadeIn delay={0.85} y={16} duration={0.8}>
				<div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-start justify-between gap-6 border-t border-white/5 bg-warm-dark/40 px-6 py-8 backdrop-blur-sm md:flex-row md:items-center md:px-10">
					<p className="max-w-sm font-body text-sm font-light leading-relaxed text-warm-muted md:text-[0.95rem]">
						{hero.intro}
					</p>
					<ContactButton />
				</div>
			</FadeIn>
		</section>
	);
}
