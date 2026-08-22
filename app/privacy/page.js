export const metadata = { title: "Privacy · Le mie spese" };

export default function PrivacyPage() {
  return (
    <div className="wrap" style={{ paddingBottom: 40 }}>
      <h1 className="pagetitle" style={{ marginTop: 10 }}>
        Informativa sulla privacy
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>
        Ultimo aggiornamento: 22 agosto 2026
      </p>

      <div style={{ lineHeight: 1.6, fontSize: 15, marginTop: 10 }}>
        <p>
          «Le mie spese» è un'applicazione <strong>personale</strong> per il monitoraggio
          delle proprie spese. Questa informativa descrive quali dati vengono trattati e
          come.
        </p>

        <h3>Dati trattati</h3>
        <p>
          Con il tuo consenso esplicito, l'app accede in <strong>sola lettura</strong> ai
          dati dei tuoi conti bancari (saldi e transazioni) tramite l'aggregatore
          <strong> Enable Banking Oy</strong>, prestatore autorizzato di servizi di
          informazione sui conti (AISP) regolato dalla Finnish Financial Supervisory
          Authority. L'app non può disporre pagamenti né movimentare denaro.
        </p>

        <h3>Finalità</h3>
        <p>
          I dati sono usati esclusivamente per mostrarti riepiloghi, categorie e statistiche
          delle tue spese all'interno dell'app. Non vengono venduti né condivisi con terze
          parti per finalità di marketing.
        </p>

        <h3>Conservazione</h3>
        <p>
          Le transazioni vengono salvate in un database privato (Supabase) protetto da
          controlli di accesso per riga, accessibile solo al tuo account. Puoi eliminare in
          qualsiasi momento le connessioni bancarie e i dati associati dalle impostazioni
          dell'app.
        </p>

        <h3>Consenso</h3>
        <p>
          Il consenso all'accesso ai conti ha durata massima di 90 giorni, come previsto
          dalla normativa PSD2, ed è rinnovabile. Puoi revocarlo scollegando la banca
          dall'app o tramite la tua banca.
        </p>

        <h3>Contatti</h3>
        <p>
          Per qualsiasi richiesta relativa ai tuoi dati puoi contattare il titolare dell'app
          all'indirizzo indicato in fase di registrazione dell'applicazione presso Enable
          Banking.
        </p>
      </div>
    </div>
  );
}
