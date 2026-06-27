import type { ReactNode } from "react";

type ViewGalleryButtonProps = {
	children?: ReactNode;
	className?: string;
	onClick?: () => void;
};

/** Ghost outline button for journey cards. */
export default function ViewGalleryButton({
	children = "View Gallery",
	className = "",
	onClick,
}: ViewGalleryButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-full border border-warm-light/25 px-6 py-2.5 font-kanit text-xs font-medium uppercase tracking-[0.18em] text-warm-light/80 transition-all duration-300 hover:border-warm-terracotta/60 hover:bg-warm-terracotta/10 hover:text-warm-light ${className}`}
		>
			{children}
		</button>
	);
}
