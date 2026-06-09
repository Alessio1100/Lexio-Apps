import Link from "next/link";
import { APPS } from "../lib/apps";

export default function Home() {
  return (
    <div className="wrap">
      <header style={{ marginTop: 24, marginBottom: 30 }}>
        <div className="brand">
          <span className="brandmark">L</span>
          <span>
            Lexio<span style={{ color: "var(--indigo-soft)" }}>Apps</span>
          </span>
        </div>
        <p className="tagline">
          Il tuo hub personale di mini-app. Scegli quella che ti serve.
        </p>
      </header>

      <main style={{ flex: 1 }}>
        <div className="grid">
          {APPS.map((app) =>
            app.available ? (
              <Link key={app.slug} href={`/${app.slug}`} className="appcard">
                <div
                  className="appicon"
                  style={{
                    background: `linear-gradient(150deg, ${app.accent}, ${app.accent}99)`,
                  }}
                >
                  {app.icon}
                </div>
                <div className="appbody">
                  <div className="appname">{app.name}</div>
                  <div className="appdesc">{app.description}</div>
                </div>
                <div className="appchevron">›</div>
              </Link>
            ) : (
              <div key={app.slug} className="appcard disabled">
                <div className="appicon" style={{ background: "var(--card-2)" }}>
                  {app.icon}
                </div>
                <div className="appbody">
                  <div className="appname">{app.name}</div>
                  <div className="appdesc">{app.description}</div>
                </div>
                <div className="soon">presto</div>
              </div>
            )
          )}
        </div>
      </main>

      <footer className="hubfoot">
        Lexio Apps · {APPS.filter((a) => a.available).length} app disponibili
      </footer>

      <style>{`
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.8px;
        }
        .brandmark {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(150deg, var(--indigo), #4f46e5);
          display: grid;
          place-items: center;
          font-size: 26px;
          font-weight: 800;
          color: white;
          box-shadow: 0 10px 30px -8px rgba(99, 102, 241, 0.6);
        }
        .tagline {
          color: var(--muted);
          font-size: 14.5px;
          margin: 14px 2px 0;
          line-height: 1.5;
        }
        .grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .appcard {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          border-radius: 18px;
          background: linear-gradient(160deg, var(--card-2), var(--card));
          border: 1px solid var(--border);
          text-decoration: none;
          color: var(--text);
          transition: 0.16s;
        }
        .appcard:active {
          transform: scale(0.985);
        }
        .appcard:hover {
          border-color: rgba(99, 102, 241, 0.45);
        }
        .appcard.disabled {
          opacity: 0.55;
        }
        .appicon {
          width: 54px;
          height: 54px;
          min-width: 54px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          font-size: 22px;
          font-weight: 700;
          color: white;
        }
        .appbody {
          flex: 1;
          min-width: 0;
        }
        .appname {
          font-size: 16.5px;
          font-weight: 650;
          letter-spacing: -0.2px;
        }
        .appdesc {
          font-size: 13px;
          color: var(--muted);
          margin-top: 3px;
          line-height: 1.45;
        }
        .appchevron {
          font-size: 26px;
          color: var(--muted);
          margin-left: 4px;
        }
        .soon {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          background: var(--card);
          border: 1px solid var(--border);
          padding: 4px 10px;
          border-radius: 999px;
        }
        .hubfoot {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: var(--muted);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
