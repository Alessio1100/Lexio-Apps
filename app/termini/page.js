export const metadata = { title: "Termini · Le mie spese" };

export default function TerminiPage() {
  return (
    <div className="wrap" style={{ paddingBottom: 40 }}>
      <h1 className="pagetitle" style={{ marginTop: 10 }}>
        Termini di servizio
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>
        Ultimo aggiornamento: 22 agosto 2026
      </p>

      <div style={{ lineHeight: 1.6, fontSize: 15, marginTop: 10 }}>
        <p>
          «Le mie spese» è un'applicazione a uso personale che aggrega e visualizza i dati
          dei conti bancari dell'utente a scopo informativo.
        </p>

        <h3>Uso del servizio</h3>
        <p>
          L'app fornisce una visualizzazione delle spese e non costituisce consulenza
          finanziaria, fiscale o di investimento. Le informazioni mostrate hanno finalità
          puramente informative.
        </p>

        <h3>Accesso ai conti</h3>
        <p>
          L'accesso ai dati bancari avviene in sola lettura tramite l'aggregatore Enable
          Banking Oy, previo consenso esplicito dell'utente presso la propria banca. L'app
          non effettua pagamenti né trasferimenti.
        </p>

        <h3>Assenza di garanzie</h3>
        <p>
          Il servizio è fornito «così com'è». I dati provengono dalle banche tramite terze
          parti e potrebbero non essere sempre completi o aggiornati in tempo reale.
        </p>

        <h3>Limitazione di responsabilità</h3>
        <p>
          Il titolare dell'app non è responsabile per eventuali decisioni prese sulla base
          delle informazioni mostrate, né per interruzioni o inesattezze dei dati forniti
          dalle banche o dall'aggregatore.
        </p>

        <h3>Modifiche</h3>
        <p>
          Questi termini possono essere aggiornati nel tempo. L'uso continuato dell'app
          costituisce accettazione della versione vigente.
        </p>
      </div>
    </div>
  );
}
