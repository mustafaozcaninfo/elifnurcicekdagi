import { Camera, Moon, Plane, Luggage } from "lucide-react";
import AnimatedText from "../components/AnimatedText";
import ContactButton from "../components/ContactButton";
import FadeIn from "../components/FadeIn";
import { useSite } from "../hooks/useSite";

const DECOR = [
	{ Icon: Plane, className: "left-[6%] top-[12%] text-warm-terracotta/30", size: 48 },
	{ Icon: Moon, className: "right-[8%] top-[18%] text-warm-sage/35", size: 40 },
	{ Icon: Camera, className: "left-[10%] bottom-[20%] text-warm-mustard/25", size: 44 },
	{ Icon: Luggage, className: "right-[6%] bottom-[15%] text-warm-terracotta/20", size: 52 },
] as const;

export default function About() {
	const { about } = useSite();

	return (
		<section
			id="about"
			className="relative flex min-h-screen items-center justify-center overflow-hidden bg-warm-dark px-6 py-24 md:px-10"
		>
			{DECOR.map(({ Icon, className, size }, i) => (
				<Icon
					key={i}
					size={size}
					strokeWidth={1}
					className={`pointer-events-none absolute hidden md:block ${className}`}
					aria-hidden
				/>
			))}

			<div className="relative z-10 mx-auto max-w-3xl text-center">
				<FadeIn y={30}>
					<h2
						className="font-kanit font-black tracking-tight text-gradient"
						style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
					>
						{about.heading}
					</h2>
				</FadeIn>

				<div className="mt-10 md:mt-14">
					<AnimatedText
						text={about.body}
						className="mx-auto max-w-2xl text-left text-[clamp(1rem,2.2vw,1.25rem)] md:text-center"
					/>
				</div>

				<FadeIn delay={0.2} className="mt-12 flex flex-wrap items-center justify-center gap-4">
					<ContactButton href="#journeys" variant="secondary">
						View My Journeys
					</ContactButton>
					<ContactButton href="/contact">Contact Me</ContactButton>
				</FadeIn>
			</div>
		</section>
	);
}
