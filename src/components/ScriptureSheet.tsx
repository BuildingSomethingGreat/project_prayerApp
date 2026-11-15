import { motion } from "framer-motion";
import { TRANSLATION } from "../content/verses";
import type { Verse } from "../lib/types";

interface Props {
  verses: Verse[];
  onClose: () => void;
  onHear: (verseId: string) => void;
}

/** The Word, in full, whenever she wants to read it for herself. Drag down or tap outside to close. */
export function ScriptureSheet({ verses, onClose, onHear }: Props) {
  return (
    <>
      <motion.div className="sheet-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Scripture in this moment"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => (info.offset.y > 110 || info.velocity.y > 600) && onClose()}
      >
        <div className="sheet__grip" />
        <h2 className="eyebrow">Scripture in this moment</h2>
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
