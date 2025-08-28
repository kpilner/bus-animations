import React, { useMemo, useState } from 'react';
import BusMapAnimation from './BusMapAnimation';
import FactsBox from './FactsBox';
import styles from './App.module.css';

function App() {
  // removed scale/offset; drawing in raw SVG coordinates now
  const [url, setUrl] = useState('/map.png');
  const [autoFacts, setAutoFacts] = useState(false);
  const [redoTick, setRedoTick] = useState(0);
  const [resetTick, setResetTick] = useState(0);
  const [showFacts, setShowFacts] = useState(true);
  const [busDelaySec, setBusDelaySec] = useState(1);
  const [factDelaySec, setFactDelaySec] = useState(1);
  const [pathColor, setPathColor] = useState('#673ab7');
  const [showPath, setShowPath] = useState(true);
  const [factsTitle, setFactsTitle] = useState('Southern Coastal Region');
  const [factsInput, setFactsInput] = useState(
    'The Southern Coastal Region runs along the western part of the state and borders the Pacific Ocean.\nIt is about 400 miles long from the Bay Area to Mexico.\nIt contains sandy beaches, coastal mountains, and the Channel Islands.'
  );
  // Facts position (px). X controls left, Y controls top.
  const [factsX, setFactsX] = useState(500); // px
  const [factsY, setFactsY] = useState(200);  // px

  // Parse facts: support optional image URL with delimiter " | "
  const factsList = useMemo(() =>
    factsInput
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split(' | ');
        if (parts.length >= 2) {
          return { text: parts[0].trim(), image: parts.slice(1).join(' | ').trim() };
        }
        return { text: line };
      })
  , [factsInput]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bus Animations: Southern Coastal Region</h1>

      <div style={{display:'flex',gap:'0.75rem',alignItems:'center',flexWrap:'wrap'}}>
        <label>Image URL: <input value={url} onChange={e=>setUrl(e.target.value)} style={{width:260}} /></label>
        <label>Bus start delay (sec): <input type="number" min="0" max="10" step="0.5" value={busDelaySec} onChange={(e)=>setBusDelaySec(Number(e.target.value)||0)} style={{width:70}} /></label>
        <label>First fact delay (sec): <input type="number" min="0" max="10" step="0.5" value={factDelaySec} onChange={(e)=>setFactDelaySec(Number(e.target.value)||0)} style={{width:70}} /></label>
        <label>Fact interval (sec): <input type="number" min="2" max="15" step="1" value={Math.round(window.__factInterval||5)} onChange={(e)=>{window.__factInterval = Math.max(2, Math.min(15, parseInt(e.target.value)||5));}} style={{width:60}} /></label>
        <label>Path color: <input type="color" value={pathColor} onChange={(e)=>setPathColor(e.target.value)} /></label>
        <label>
          <input type="checkbox" checked={showPath} onChange={(e)=>setShowPath(e.target.checked)} /> Draw path
        </label>
        <button onClick={()=>{ setRedoTick(t=>t+1); }}>
          Redo Animation
        </button>
        <button onClick={()=>{ setResetTick(t=>t+1); }}>
          Reset
        </button>
        <label>
          <input type="checkbox" checked={showFacts} onChange={(e)=>setShowFacts(e.target.checked)} /> Show facts box
        </label>
      </div>

      <div className={styles.content}>
        <BusMapAnimation
          backgroundUrl={url}
          redoTick={redoTick}
          resetTick={resetTick}
          busDelayMs={Math.max(0, busDelaySec)*1000}
          factsDelayMs={Math.max(0, factDelaySec)*1000}
          pathColor={pathColor}
          showPath={showPath}
          onFactsStart={()=>setAutoFacts(true)}
        />
        <div className={styles.sidebar}>
          <div className={styles.editorPanel}>
            <label className={styles.editorField}>Facts Title
              <input value={factsTitle} onChange={(e)=>setFactsTitle(e.target.value)} />
            </label>
            <label className={styles.editorField}>Facts (one per line; optional image: "text | https://image")
              <textarea value={factsInput} onChange={(e)=>setFactsInput(e.target.value)} rows={6} />
            </label>
            <div style={{display:'flex', gap:'0.5rem'}}>
              <label className={styles.editorField} style={{flex:'1 1 0%'}}>Facts Left (px)
                <input type="number" value={factsX} onChange={(e)=>setFactsX(parseInt(e.target.value)||0)} />
              </label>
              <label className={styles.editorField} style={{flex:'1 1 0%'}}>Facts Top (px)
                <input type="number" value={factsY} onChange={(e)=>setFactsY(parseInt(e.target.value)||0)} />
              </label>
            </div>
          </div>
          <div className={styles.sidebarHint}>Click six points to form the bus's route</div>
          {showFacts && (
            <FactsBox
              title={factsTitle}
              facts={factsList}
              auto={autoFacts}
              intervalMs={(window.__factInterval||5)*1000}
              positionTop={factsY}
              positionLeft={factsX}
              redoTick={redoTick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
