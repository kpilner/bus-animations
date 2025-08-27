import React, { useEffect, useState } from 'react';
import styles from './FactsBox.module.css';

const defaultFacts = [
  { text: 'The Southern Coastal Region runs along the western part of the state and borders the Pacific Ocean.' },
  { text: 'It is about 400 miles long from the Bay Area to Mexico.' },
  { text: 'It contains sandy beaches, coastal mountains, and the Channel Islands.' }
];

export default function FactsBox({ title: titleProp = 'Southern Coastal Region', facts = defaultFacts, auto = true, intervalMs = 4000, positionTop = 320, positionLeft = -580 }) {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState(facts);
  const [title, setTitle] = useState(titleProp);

  // keep local editable list in sync if parent facts change
  useEffect(() => setItems(facts), [facts]);
  // keep title in sync with parent input
  useEffect(() => setTitle(titleProp), [titleProp]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setIndex(i => (i + 1) % (items.length || 1)), intervalMs);
    return () => clearInterval(t);
  }, [auto, intervalMs, items.length]);

  const onInput = (e) => {
    const text = e.currentTarget.innerText;
    setItems(prev => prev.map((v, i) => {
      if (i !== index) return v;
      // preserve image if present
      if (v && typeof v === 'object') {
        return { ...v, text };
      }
      return { text };
    }));
  };

  const onKeyDown = (e) => {
    // keep it single-line-ish; prevent enter from inserting newlines
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const current = items[index] || {};
  const currentText = typeof current === 'string' ? current : (current.text || '');
  const currentImg = typeof current === 'object' ? current.image : undefined;

  return (
    <aside className={styles.box} style={{ top: positionTop, marginLeft: positionLeft }}>
      <h2
        contentEditable
        suppressContentEditableWarning
        onInput={(e)=>setTitle(e.currentTarget.innerText)}
        role="textbox"
        aria-label="Edit title"
      >
        {title}
      </h2>
      {currentImg && (
        <img src={currentImg} alt="Fact visual" className={styles.image} />
      )}
      <div
        className={styles.fact}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        onKeyDown={onKeyDown}
        role="textbox"
        aria-label="Edit fact"
      >
        {currentText}
      </div>
    </aside>
  );
}
