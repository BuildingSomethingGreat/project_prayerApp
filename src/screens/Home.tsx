import { Page, Rise } from "../components/Page";
import { Plus } from "../components/Icons";
import { TRANSLATION, verseOfTheDay } from "../content/verses";
import { useApp } from "../lib/store";
import type { Session } from "../lib/types";

function greeting(hour = new Date().getHours()): [string, string] {
  if (hour < 5) return ["Still awake?", "He is too."];
  if (hour < 12) return ["Good morning.", "Begin here."];
  if (hour < 18) return ["Good afternoon.", "Pause a while."];
  return ["Good evening.", "Lay it down."];
}

function when(session: Session): string {
  const days = Math.floor((Date.now() - session.createdAt) / 86_400_000);
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  return new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Home() {
  const sessions = useApp((s) => s.sessions);
  const go = useApp((s) => s.go);
  const open = useApp((s) => s.open);
  const setIntention = useApp((s) => s.setIntention);
  const [hello, invite] = greeting();
  const verse = verseOfTheDay();

  const begin = () => {
    setIntention("");
    go("intention");
  };

  return (
    <Page className="home">
      <header className="topbar">
        <span className="wordmark" style={{ paddingLeft: 10 }}>
          liora
        </span>
        <button className="icon-btn icon-btn--ring" onClick={begin} aria-label="Begin a new moment">
          <Plus />
        </button>
      </header>

      <Rise className="home__greeting">
        <h1 className="display">
          {hello}
          <span>{invite}</span>
        </h1>
      </Rise>

      <Rise delay={0.08}>
        <article className="glass verse-card">
          <span className="eyebrow">Today's word</span>
          <p className="scripture">{verse.text}</p>
          <cite>
            {verse.ref} · {TRANSLATION.abbreviation}
          </cite>
        </article>
      </Rise>

      <Rise delay={0.16}>
        <button className="btn" onClick={begin}>
          Begin a new moment
        </button>
      </Rise>

      <Rise delay={0.24}>
        <h2 className="eyebrow" style={{ marginBottom: 12 }}>
          Your moments
        </h2>
        {sessions.length === 0 ? (
          <p className="empty">The moments you create will rest here, ready to return to.</p>
        ) : (
          <div className="moments">
            {sessions.map((session) => (
              <button key={session.id} className="moment" onClick={() => open(session)}>
                <img className="moment__art" src={`/media/${session.scene}.jpg`} alt="" loading="lazy" />
                <span className="moment__text">
                  <strong>{session.title}</strong>
                  <span>
                    {session.subtitle} · {when(session)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Rise>
    </Page>
  );
}
