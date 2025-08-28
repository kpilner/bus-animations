import React, { useRef, useEffect, useState } from 'react';
import styles from './BusMapAnimation.module.css';

// Convert waypoint points into a smooth quadratic path string
function pointsToPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y}`;
  }
  let d = '';
  const p0 = points[0];
  d += `M ${p0.x} ${p0.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    if (i === 0) {
      d += ` Q ${a.x} ${a.y} ${mx} ${my}`;
    } else {
      d += ` T ${mx} ${my}`;
    }
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

const star = (
  <polygon points="500,160 507,178 526,178 511,189 517,208 500,197 483,208 489,189 474,178 493,178" fill="#FFD700" stroke="#333" strokeWidth="2" />
);

export default function BusMapAnimation({ backgroundUrl = '/map.png', redoTick = 0, resetTick = 0, busDelayMs = 0, factsDelayMs = 0, pathColor = '#673ab7', onFactsStart = () => {} }) {
  const busRef = useRef();
  const [length, setLength] = useState(0);
  const [progress, setProgress] = useState(0);
  const [points, setPoints] = useState([]);
  const [running, setRunning] = useState(false);
  const busStartTimer = useRef(null);
  const factsStartTimer = useRef(null);

  const pathD = pointsToPath(points);
  const instruction = !running && points.length < 6
    ? `Click to set ${points.length===0? 'START': points.length<5? 'MIDDLE':'END'} point (${points.length+1}/6)`
    : '';

  useEffect(() => {
    // Get total path length for animation
    const path = document.getElementById('route-path');
    if (path) {
      setLength(path.getTotalLength());
    }
  }, [pathD]);

  // Redo animation on external signal while keeping the same points
  useEffect(() => {
    if (!redoTick) return;
    if (points.length === 6) {
      // clear any pending timers
      if (busStartTimer.current) { clearTimeout(busStartTimer.current); busStartTimer.current = null; }
      if (factsStartTimer.current) { clearTimeout(factsStartTimer.current); factsStartTimer.current = null; }
      // stop then schedule restart after delays
      setRunning(false);
      setProgress(0);
      busStartTimer.current = setTimeout(() => {
        setRunning(true);
      }, Math.max(0, busDelayMs));
      factsStartTimer.current = setTimeout(() => {
        onFactsStart();
      }, Math.max(0, factsDelayMs));
    }
  }, [redoTick, points.length, busDelayMs, factsDelayMs, onFactsStart]);

  // Reset: stop, clear timers, bring bus back to first point and remove path
  useEffect(() => {
    if (!resetTick) return;
    // clear timers
    if (busStartTimer.current) { clearTimeout(busStartTimer.current); busStartTimer.current = null; }
    if (factsStartTimer.current) { clearTimeout(factsStartTimer.current); factsStartTimer.current = null; }
    // stop animation
    setRunning(false);
    setProgress(0);
    setPoints(prev => {
      const first = prev[0];
      return first ? [first] : [];
    });
  }, [resetTick]);

  useEffect(() => {
    if (!running) return;
    let frame;
    const duration = 8000; // ms, slower for longer custom paths
    const start = performance.now();
    function animateBus(now) {
      const elapsed = Math.min(now - start, duration);
      setProgress(elapsed / duration);
      if (elapsed < duration) {
        frame = requestAnimationFrame(animateBus);
      }
    }
    setProgress(0);
    frame = requestAnimationFrame(animateBus);
    return () => cancelAnimationFrame(frame);
  }, [running, pathD]);

  // Calculate bus position along the path
  let busX = 90, busY = 320, angle = 0;
  if (length && progress < 1) {
    const path = document.getElementById('route-path');
    if (path) {
      const pt = path.getPointAtLength(length * progress);
      busX = pt.x;
      busY = pt.y;
      // Calculate angle for bus rotation
      const delta = 1;
      const ptAhead = path.getPointAtLength(Math.min(length * progress + delta, length));
      angle = Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * 180 / Math.PI;
    }
  } else if (length) {
    const path = document.getElementById('route-path');
    if (path) {
      const pt = path.getPointAtLength(length);
      busX = pt.x;
      busY = pt.y;
    }
  }
  // If not running and we only have a starting point, ensure bus is at that point
  if (!running && points.length === 1) {
    busX = points[0].x;
    busY = points[0].y;
  }

  // Keep bus from going upside down: constrain to [-90, 90] by rotating 180° when necessary
  // Allow it to follow the path turns, but avoid wheels-up orientation.
  let displayAngle = angle;
  let flipped180 = false;
  if (displayAngle > 90) { displayAngle -= 180; flipped180 = true; }
  if (displayAngle < -90) { displayAngle += 180; flipped180 = true; }

  // Click handler to add waypoints in the transformed group space
  function handleSvgClick(e) {
    // Determine SVG coordinates
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return;
    const svgP = pt.matrixTransform(screenCTM.inverse());
    const gx = svgP.x;
    const gy = svgP.y;
    setPoints(prev => {
      if (prev.length >= 6) return prev; // ignore extra clicks
      const next = [...prev, { x: Math.round(gx), y: Math.round(gy) }];
      if (next.length === 6) {
        // clear any pending timers first
        if (busStartTimer.current) { clearTimeout(busStartTimer.current); busStartTimer.current = null; }
        if (factsStartTimer.current) { clearTimeout(factsStartTimer.current); factsStartTimer.current = null; }
        // schedule animation and facts start respecting delays
        busStartTimer.current = setTimeout(() => {
          setRunning(true);
        }, Math.max(0, busDelayMs));
        factsStartTimer.current = setTimeout(() => {
          onFactsStart();
        }, Math.max(0, factsDelayMs));
      }
      return next;
    });
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (busStartTimer.current) clearTimeout(busStartTimer.current);
      if (factsStartTimer.current) clearTimeout(factsStartTimer.current);
    };
  }, []);


  return (
    <div className={styles.mapContainer}>
      {!running && instruction && (
        <div className={styles.instruction}>{instruction}</div>
      )}
      <svg viewBox="0 0 600 400" className={styles.mapSvg} onClick={handleSvgClick}>
        {/* Background image (placed behind all vector layers) */}
        <image href={backgroundUrl}
               x="0" y="0" width="600" height="400"
               preserveAspectRatio="xMidYMid meet"
               opacity="0.95" />

        {/* Route and bus (in raw SVG coordinates) */}
        {/* Only render route path when we have at least 2 points */}
        {points.length >= 2 && (
          <>
            <path id="route-path" d={pathD} fill="none" stroke={pathColor} strokeWidth="14" strokeLinejoin="round" />
            <path d={pathD} fill="none" stroke="#FFD600" strokeWidth="4" strokeDasharray="12,12" />
          </>
        )}
        {/* Temporary waypoint marks (only before run) */}
        {!running && points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={i===0? '#4CAF50':'#333'} opacity="0.6" />
        ))}
        {/* Bus */}
        {(() => {
          // slight bounce and wheel rotation proportional to travel
          const bounce = 1.2 * Math.sin(progress * Math.PI * 4);
          const wheelR = 5.5;
          const wheelAngle = length ? (progress * length) / wheelR : 0;
          return (
            <g ref={busRef} transform={`translate(${busX - 24},${busY - 16 + bounce}) rotate(${displayAngle},24,16)`}>
                {/* shadow */}
                <ellipse cx="22" cy="28" rx="18" ry="4" fill="rgba(0,0,0,0.15)" />
                {/* Bus body two-tone */}
                <rect x="2" y="2" width="44" height="26" rx="6" fill="#ffca28" stroke="#1a237e" strokeWidth="2" />
                <rect x="2" y="14" width="44" height="14" rx="0" fill="#f9a825" />
                {/* Roof stripe */}
                <rect x="2" y="2" width="44" height="4" fill="#1a237e" />
                {/* Windows */}
                <rect x="8" y="6" width="9" height="7" rx="1.5" fill="#bbdefb" stroke="#90caf9" />
                <rect x="20" y="6" width="9" height="7" rx="1.5" fill="#bbdefb" stroke="#90caf9" />
                <rect x="32" y="6" width="9" height="7" rx="1.5" fill="#bbdefb" stroke="#90caf9" />
                {/* Door hint */}
                <rect x="18" y="14" width="7" height="12" fill="rgba(255,255,255,0.15)" stroke="#fbc02d" />
                {/* Wheels with hubcaps and rotation */}
                <g transform={`rotate(${wheelAngle * 57.2958},12,26)`}>
                  <circle cx="12" cy="26" r="6" fill="#212121" />
                  <circle cx="12" cy="26" r="2" fill="#9e9e9e" />
                </g>
                <g transform={`rotate(${wheelAngle * 57.2958},34,26)`}>
                  <circle cx="34" cy="26" r="6" fill="#212121" />
                  <circle cx="34" cy="26" r="2" fill="#9e9e9e" />
                </g>
                {/* Removed start label flash */}
              {/* Headlight and tail light (not flipped): swap sides based on direction */}
              {(() => {
                // If we normalized by 180° (flipped180), the actual heading is left-ish,
                // so the front (headlight) should be on the left side (x=2).
                const headX = flipped180 ? 2 : 46;
                const tailX = flipped180 ? 46 : 2;
                return (
                  <>
                    <circle cx={headX} cy="20" r="2" fill="#fff59d" stroke="#fdd835" />
                    <rect x={tailX} y="20" width="3" height="3" fill="#ef5350" />
                  </>
                );
              })()}
            </g>
          );
        })()}
        {/* Instructions moved outside SVG */}
        {/* Overlay UI removed */}
      </svg>
    </div>
  );
}
