import { motion } from "framer-motion";
import { TRANSLATION } from "../content/verses";
import type { Verse } from "../lib/types";
import { useMedia, WIDE } from "../lib/useMedia";

interface Props {
  verses: Verse[];
  onClose: () => void;
  onHear: (verseId: string) => void;
}

/**
 * The Word, in full, whenever she wants to read it for herself. A sheet that
 * rises from the bottom on a phone, and a drawer from the right on desktop.
 */
export function ScriptureSheet({ verses, onClose, onHear }: Props) {
  const wide = useMedia(WIDE);
  const hidden = wide ? { x: "100%" } : { y: "100%" };
  const shown = wide ? { x: 0 } : { y: 0 };

  return (
    <>
      <motion.div className="sheet-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Scripture in this moment"
        initial={hidden}
        animate={shown}
        exit={hidden}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        drag={wide ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => (info.offset.y > 110 || info.velocity.y > 600) && onClose()}
      >
        <div className="sheet__grip" />
        <div className="sheet__head">
          <h2 className="eyebrow">Scripture in this moment</h2>
          <button className="pill wide-only" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sheet__body">
          {verses.map((verse) => (
            <article key={verse.id} className="sheet__verse">
              <p className="scripture">{verse.text}</p>
              <footer>
                <cite>
                  {verse.ref}
                  <small>{TRANSLATION.name}</small>
                </cite>
                <button className="pill" onClick={() => onHear(verse.id)}>
                  Hear it
                </button>
              </footer>
            </article>
          ))}
        </div>
      </motion.section>
    </>
  );
}
