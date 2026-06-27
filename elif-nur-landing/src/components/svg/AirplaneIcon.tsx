type Props = {
	bearing?: number;
	size?: number;
	className?: string;
	glow?: boolean;
};

/** Top-down jet silhouette for globe markers. */
export default function AirplaneIcon({
	bearing = 0,
	size = 28,
	className = "",
	glow = true,
}: Props) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 48 48"
			fill="none"
			className={className}
			style={{
				transform: `rotate(${bearing - 90}deg)`,
				filter: glow ? "drop-shadow(0 0 6px rgba(212,160,23,0.85))" : undefined,
			}}
			aria-hidden
		>
			<path
				d="M24 4 L28 18 L44 22 L28 26 L30 40 L24 36 L18 40 L20 26 L4 22 L20 18 Z"
				fill="url(#planeFill)"
				stroke="#F5EDE4"
				strokeWidth="1.2"
				strokeLinejoin="round"
			/>
			<path
				d="M24 14 L24 32"
				stroke="rgba(245,237,228,0.45)"
				strokeWidth="1"
				strokeLinecap="round"
			/>
			<path
				d="M14 22 L34 22"
				stroke="rgba(245,237,228,0.35)"
				strokeWidth="0.8"
				strokeLinecap="round"
			/>
			<circle cx="24" cy="22" r="2.5" fill="#D4A017" />
			<defs>
				<linearGradient id="planeFill" x1="24" y1="4" x2="24" y2="40">
					<stop offset="0%" stopColor="#F5EDE4" />
					<stop offset="55%" stopColor="#D4A017" />
					<stop offset="100%" stopColor="#C25B3F" />
				</linearGradient>
			</defs>
		</svg>
	);
}
