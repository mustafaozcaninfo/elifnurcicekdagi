import type { ReactNode, CSSProperties } from "react";

type ContactButtonProps = {
	href?: string;
	children?: ReactNode;
	className?: string;
	onClick?: () => void;
	variant?: "primary" | "secondary";
};

const primaryStyle: CSSProperties = {
	background: "linear-gradient(135deg, #C25B3F 0%, #D4A017 100%)",
};

const secondaryStyle: CSSProperties = {
	background: "transparent",
	border: "1px solid rgba(245, 237, 228, 0.25)",
};

/** Warm terracotta-to-mustard gradient pill CTA. */
export default function ContactButton({
	href = "/iletisim",
	children = "Get in Touch",
	className = "",
	onClick,
	variant = "primary",
}: ContactButtonProps) {
	const base =
		"inline-flex items-center justify-center rounded-full px-8 py-3.5 font-kanit text-sm font-medium uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.98]";
	const variantClass =
		variant === "primary"
			? "text-white shadow-pill hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(194,91,63,0.45)]"
			: "text-warm-light/90 hover:border-warm-terracotta/50 hover:bg-warm-terracotta/10";
	const style = variant === "primary" ? primaryStyle : secondaryStyle;

	if (onClick) {
		return (
			<button type="button" onClick={onClick} className={`${base} ${variantClass} ${className}`} style={style}>
				{children}
			</button>
		);
	}

	return (
		<a href={href} className={`${base} ${variantClass} ${className}`} style={style}>
			{children}
		</a>
	);
}
