import logo777 from "../assets/777_OPCL.svg";

type Props = {
	className?: string;
};

/** Side-profile B777 mark from 777_OPCL.svg — tuned for dark cockpit chrome. */
export default function B777LogoMark({ className = "" }: Props) {
	return (
		<img
			src={logo777}
			alt=""
			aria-hidden
			draggable={false}
			decoding="async"
			className={`deck-brand-777 h-full w-full object-contain object-center ${className}`}
		/>
	);
}
