import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Radio, Send } from "lucide-react";
import { useCallback, useState } from "react";
import TurnstileField from "./TurnstileField";

type Status = { kind: "idle" | "ok" | "err"; message: string };

const fieldClass =
	"w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-ui text-sm text-warm-light outline-none transition-colors placeholder:text-warm-muted/60 focus:border-warm-mustard/40 focus:ring-1 focus:ring-warm-mustard/25";

export default function ContactForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [consent, setConsent] = useState(false);
	const [honeypot, setHoneypot] = useState("");
	const [turnstileToken, setTurnstileToken] = useState("");
	const [turnstileKey, setTurnstileKey] = useState(0);
	const [submitting, setSubmitting] = useState(false);
	const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

	const onTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);
	const onTurnstileExpire = useCallback(() => setTurnstileToken(""), []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus({ kind: "idle", message: "" });

		if (!consent) {
			setStatus({
				kind: "err",
				message: "Please accept the privacy policy to continue.",
			});
			return;
		}
		if (!turnstileToken) {
			setStatus({
				kind: "err",
				message: "Please complete the security check.",
			});
			return;
		}

		setSubmitting(true);
		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					message: message.trim(),
					consent: true,
					"cf-turnstile-response": turnstileToken,
					website: honeypot,
				}),
			});
			const data = (await res.json()) as { message?: string; error?: string };
			if (res.ok) {
				setStatus({
					kind: "ok",
					message: data.message || "Message received. Thank you!",
				});
				setName("");
				setEmail("");
				setMessage("");
				setConsent(false);
				setTurnstileToken("");
				setTurnstileKey((k) => k + 1);
			} else {
				setStatus({
					kind: "err",
					message: data.error || "Something went wrong. Please try again.",
				});
			}
		} catch {
			setStatus({
				kind: "err",
				message: "Connection error. Please try again.",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<motion.form
			onSubmit={handleSubmit}
			className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080604]/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-8"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
			noValidate
		>
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warm-mustard/50 to-transparent"
				aria-hidden
			/>

			<div className="mb-6 flex items-center gap-2">
				<Radio className="h-4 w-4 text-warm-mustard deck-blink" strokeWidth={1.5} />
				<p className="font-ui text-[0.68rem] font-medium uppercase tracking-[0.22em] text-warm-mustard">
					Open frequency
				</p>
			</div>

			<div className="absolute -left-[9999px]" aria-hidden>
				<label htmlFor="website">Website</label>
				<input
					id="website"
					name="website"
					type="text"
					tabIndex={-1}
					autoComplete="off"
					value={honeypot}
					onChange={(e) => setHoneypot(e.target.value)}
				/>
			</div>

			<div className="space-y-4">
				<div>
					<label htmlFor="contact-name" className="mb-1.5 block font-ui text-xs font-medium text-warm-muted">
						Full name
					</label>
					<input
						id="contact-name"
						name="name"
						type="text"
						required
						maxLength={120}
						autoComplete="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className={fieldClass}
						placeholder="Your name"
					/>
				</div>

				<div>
					<label htmlFor="contact-email" className="mb-1.5 block font-ui text-xs font-medium text-warm-muted">
						Email
					</label>
					<input
						id="contact-email"
						name="email"
						type="email"
						required
						maxLength={254}
						autoComplete="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className={fieldClass}
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label htmlFor="contact-message" className="mb-1.5 block font-ui text-xs font-medium text-warm-muted">
						Message
					</label>
					<textarea
						id="contact-message"
						name="message"
						required
						maxLength={5000}
						rows={5}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						className={`${fieldClass} resize-y min-h-[7.5rem]`}
						placeholder="Your message — collaborations, questions, or just a hello from the journey."
					/>
				</div>

				<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-black/25 px-4 py-3 transition-colors hover:border-white/12">
					<input
						type="checkbox"
						name="consent"
						checked={consent}
						onChange={(e) => setConsent(e.target.checked)}
						className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/50 accent-warm-mustard"
					/>
					<span className="font-ui text-[0.72rem] leading-relaxed text-warm-muted">
						I have read the{" "}
						<a href="/gizlilik" className="text-warm-mustard underline-offset-2 hover:underline">
							privacy policy
						</a>{" "}
						and agree to my personal data being processed for contact purposes.
					</span>
				</label>

				<TurnstileField
					onToken={onTurnstileToken}
					onExpire={onTurnstileExpire}
					resetKey={turnstileKey}
				/>

				<AnimatePresence mode="wait">
					{status.message && (
						<motion.p
							key={status.message}
							role="alert"
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							className={`rounded-lg px-3 py-2 font-ui text-sm ${
								status.kind === "ok"
									? "border border-warm-sage/30 bg-warm-sage/10 text-warm-sage"
									: "border border-warm-terracotta/30 bg-warm-terracotta/10 text-warm-terracotta"
							}`}
						>
							{status.message}
						</motion.p>
					)}
				</AnimatePresence>

				<button
					type="submit"
					disabled={submitting}
					className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-kanit text-sm font-medium uppercase tracking-[0.18em] text-white shadow-pill transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
					style={{
						background: "linear-gradient(135deg, #C25B3F 0%, #D4A017 100%)",
					}}
				>
					{submitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
							Transmitting…
						</>
					) : (
						<>
							<Send className="h-4 w-4" strokeWidth={1.5} />
							Send message
						</>
					)}
				</button>
			</div>
		</motion.form>
	);
}
