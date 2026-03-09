"use client";

export function FaqSection() {
  return (
    <section className="relative py-20 px-6 md:px-12 lg:px-24 bg-card border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-8 h-px bg-primary" />
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">
            {"\u010cast\u00e9 dotazy"}
          </span>
          <div className="w-8 h-px bg-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-10 text-center font-mono uppercase tracking-wider">FAQ</h2>

        {[
          {
            q: "Co je Patriot Index?",
            a: "Sledujeme a vyhodnocujeme hlasování v Poslanecké sněmovně, protože věříme, že skutečná politika se neodehrává v prohlášeních ani v předvolebních sloganech, ale při hlasování o zákonech. Zaměřujeme se především na zákony, které ovlivňují národní suverenitu, prosperitu, sílu státu, bezpečnost a identitu země. Každý z těchto zákonů hodnotíme podle jeho významu i podle konkrétních důsledků, které může mít pro budoucnost České republiky. Naším cílem je přinášet srozumitelný a férový přehled o tom, jak jednotliví poslanci skutečně hlasují. Nehodnotíme slova ani politické značky – hodnotíme pouze zákony a hlasování. Na základě toho poslancům přidělujeme nebo odečítáme body, a to podle stejných pravidel pro všechny."
          },
          {
            q: "Jak se po\u010d\u00edt\u00e1 sk\u00f3re?",
            a: "Každý poslanec zvolený 3-4. října 2025 začíná se základní hodnotou 2000 - od té se buď odečítají nebo přičítají body. Pro příklad: zákon XYZ je pro Českou republiku špatný, tudíž každý politik, který pro něj hlasuje, body ztrací. Ti co pro něj nehlasují naopak získávají. Z toho vyplývá: čím vyšší je politikovo skóre, tím lépe."
          },
          {
            q: "Co nepřítomní?",
            a: "Jsme toho názoru, že politik je do Poslanecké sněmovny volen k tomu, aby reprezentoval své voliče, z toho důvodu považujeme nepřítomnost za prohřešek, chápeme však, že poslance volají někdy i jiné povinnosti v rámci své práce, která jim znemožňuje účast na hlasování. Proto takovým poslancům budeme body ubírat,  velice jemně."
          },
          {
            q: "Jak často data aktualizujeme?",
            a: "Skóre aktualizujeme, jakmile je zákon hlasováním definitivně schválen. Vycházíme z dat dostupných na psp.cz"
          },
        ].map((faq, i) => (
          <div key={i} className="mb-6 pb-6 border-b border-border last:border-b-0">
            <h4 className="text-sm font-bold text-foreground mb-2">{faq.q}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
