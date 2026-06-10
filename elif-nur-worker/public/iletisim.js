const form = document.getElementById("contact-form");
const status = document.getElementById("status");
const btn = document.getElementById("submit-btn");

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	status.textContent = "";
	status.className = "";
	btn.disabled = true;

	if (!form.consent.checked) {
		status.textContent = "Devam etmek için gizlilik politikasını kabul etmelisiniz.";
		status.className = "err";
		btn.disabled = false;
		return;
	}

	const token = form.querySelector("[name=cf-turnstile-response]")?.value;
	if (!token) {
		status.textContent = "Lütfen güvenlik doğrulamasını tamamlayın.";
		status.className = "err";
		btn.disabled = false;
		return;
	}

	const body = {
		name: form.name.value.trim(),
		email: form.email.value.trim(),
		message: form.message.value.trim(),
		consent: true,
		"cf-turnstile-response": token,
		website: form.website.value,
	};

	try {
		const res = await fetch("/api/contact", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		const data = await res.json();
		if (res.ok) {
			status.textContent = data.message || "Mesajınız alındı. Teşekkürler!";
			status.className = "ok";
			form.reset();
			if (window.turnstile) turnstile.reset();
		} else {
			status.textContent = data.error || "Bir hata oluştu.";
			status.className = "err";
		}
	} catch {
		status.textContent = "Bağlantı hatası. Lütfen tekrar deneyin.";
		status.className = "err";
	}
	btn.disabled = false;
});
