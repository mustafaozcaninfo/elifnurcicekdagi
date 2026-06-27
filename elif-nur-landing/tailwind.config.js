/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				warm: {
					dark: "#0F0A05",
					darker: "#11100F",
					light: "#F5EDE4",
					muted: "#8C7A6B",
					cream: "#F8F1E9",
					terracotta: "#C25B3F",
					mustard: "#D4A017",
					sage: "#A8B5A2",
					midnight: "#1E2A44",
					gradientStart: "#E8D5B8",
					gradientEnd: "#F5EDE4",
				},
			},
			fontFamily: {
				kanit: ["Kanit", "system-ui", "sans-serif"],
				body: ["Inter", "system-ui", "sans-serif"],
				ui: ["Inter", "system-ui", "sans-serif"],
			},
			boxShadow: {
				gallery: "0 25px 50px -12px rgba(15, 10, 5, 0.55)",
				pill: "0 8px 32px rgba(194, 91, 63, 0.35)",
			},
		},
	},
	plugins: [],
};
