import ContactButton from "../components/ContactButton";
import FadeIn from "../components/FadeIn";
import { useSite } from "../hooks/useSite";

export default function Footer() {
	const { branding } = useSite();
	const year = new Date().getFullYear();
	const fullName = branding.siteName.includes("Özcan")
		? branding.siteName
		: `${branding.siteName} Çiçekdağı Özcan`;

	return (
		<footer className="border-t border-white/5 bg-warm-darker px-6 py-16 md:px-10 md:py-20">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center md:flex-row md:justify-between md:text-left">
				<FadeIn>
					<div>
						<p className="font-kanit text-2xl font-semibold text-warm-light">{fullName}</p>
						<p className="mt-2 font-body text-sm text-warm-muted">
							First Officer · Travel &amp; Lifestyle
						</p>
						<p className="mt-4 font-body text-xs text-warm-muted/70">
							<a href="https://elifnurcicekdagi.com" className="hover:text-warm-light">
								elifnurcicekdagi.com
							</a>
						</p>
					</div>
				</FadeIn>

				<FadeIn delay={0.1}>
					<ContactButton />
				</FadeIn>
			</div>

			<div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 font-body text-xs text-warm-muted/60 md:flex-row">
				<p>&copy; {year} Elif Nur Çiçekdağı Özcan. All rights reserved.</p>
				<nav className="flex gap-6" aria-label="Alt bağlantılar">
					<a href="/iletisim" className="transition-colors hover:text-warm-light">
						İletişim
					</a>
					<a href="/gizlilik" className="transition-colors hover:text-warm-light">
						Gizlilik
					</a>
				</nav>
			</div>
		</footer>
	);
}
