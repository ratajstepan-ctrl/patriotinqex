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
            a: "Patriot Index je nezávislý hodnotící systém, který sleduje hlasování poslanců Poslanecké sněmovny ČR a přiřazuje jim skóre na základě jejich hlasování o klíčových zákonech."
          },
          {
            q: "Jak se po\u010d\u00edt\u00e1 sk\u00f3re?",
            a: "Každý poslanec začíná s bázovým MMR skóre. Za každé hlasování se skóre mění podle toho, jak poslanec hlasoval \u2013 za vlastenecké zákony získává body, za protivlastenecké body ztrácí."
          },
          {
            q: "Jak \u010dasto se data aktualizuj\u00ed?",
            a: "Data se aktualizuj\u00ed po ka\u017ed\u00e9m hlasov\u00e1n\u00ed v Poslaneck\u00e9 sn\u011bmovn\u011b, obvykle b\u011bhem n\u011bkolika hodin."
          },
          {
            q: "Kdo stoj\u00ed za Patriot Indexem?",
            a: "Patriot Index je nez\u00e1visl\u00fd ob\u010dansk\u00fd projekt. Nejsme napojeni na \u017e\u00e1dnou politickou stranu ani hnuti."
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
