import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';
import citynutsLogo from '../assets/Citynuts-logo.webp';
import almondsImg from '../assets/almonds.png';
import cashewsImg from '../assets/cashews.png';
import discountImg from '../assets/discount.png';
import shippingImg from '../assets/shipping.png';
import pistachiosImg from '../assets/pistachios.png';
import tryAgainImg from '../assets/try_again.png';
import walnutsImg from '../assets/walnuts.png';
import iphoneImg from '../assets/iphone.png';

// ==========================================
// Types & Interfaces
// ==========================================
export interface Segment {
  label: string;
  description: string;
  color: string;
  textColor: string;
  image: string;
}

// ==========================================
// Segments Configuration (8 segments as required)
// ==========================================
export const SEGMENTS: Segment[] = [
  {
    label: "50g Almonds",
    description: "Hand-selected, slow-roasted organic Californian almonds.",
    color: "url(#grad-emerald)", // Vibrant Emerald
    textColor: "#ffffff",
    image: almondsImg
  },
  {
    label: "100g Cashews",
    description: "Jumbo gourmet cashews, lightly roasted and salted to perfection.",
    color: "url(#grad-gold)", // Vibrant Gold
    textColor: "#ffffff",
    image: cashewsImg
  },
  {
    label: "Discount 10%",
    description: "10% off your entire order of premium organic nuts.",
    color: "url(#grad-sapphire)", // Deep Sapphire
    textColor: "#ffffff",
    image: discountImg
  },
  {
    label: "Free Shipping",
    description: "Free express cold-pack shipping on your next purchase.",
    color: "url(#grad-amethyst)", // Amethyst Purple
    textColor: "#ffffff",
    image: shippingImg
  },
  {
    label: "Pistachios Mix",
    description: "Shelled organic pistachios with a hint of sea salt and lime.",
    color: "url(#grad-emerald)",
    textColor: "#ffffff",
    image: pistachiosImg
  },
  {
    label: "Better Luck Next Time",
    description: "So close! Don't lose heart, try another spin.",
    color: "url(#grad-dark)", // Sleek Dark Gray
    textColor: "#a1a1aa",
    image: tryAgainImg
  },
  {
    label: "Walnut Pack",
    description: "100g pack of premium, brain-boosting raw walnut halves.",
    color: "url(#grad-gold)",
    textColor: "#ffffff",
    image: walnutsImg
  },
  {
    label: "iPhone 17",
    description: "The ultimate premium tech prize — Brand new iPhone 17.",
    color: "url(#grad-ruby)", // Crimson Red
    textColor: "#ffed4a", // Bright Gold Text
    image: iphoneImg
  }
];

// ==========================================
// Simulated Secure Server API
// ==========================================
/**
 * MOCK SERVER-SIDE API
 * 
 * SECURITY EXPLANATION:
 * In a production environment, selecting a prize on the client-side (e.g. via Math.random() in React)
 * is highly vulnerable. Any advanced user can pause the JS execution, modify the variables, or override
 * functions to force the wheel to land on a high-value prize like the "iPhone 17".
 * 
 * Secure Production Architecture:
 * 1. The client triggers a spin by sending an authenticated API call: POST /api/wheel/spin
 * 2. The server receives the request, validates the user's eligibility and rate limits,
 *    and selects the winning prize using a cryptographically secure random number generator.
 * 3. The server-side code applies specific weights. The "iPhone 17" (Index 7) is rigged to
 *    have a probability of exactly 0% (or a tiny fractional chance backed by actual physical stock).
 * 4. The server records the transaction code and prize in the secure database.
 * 5. The server responds to the client with the winningIndex, a transactionId, and an HMAC signature.
 * 6. The React client receives this server response and executes the animation, spinning the wheel
 *    to halt exactly on the predetermined index.
 */
interface SpinResponse {
  winningIndex: number;
  transactionId: string;
  signature: string;
  serverTimestamp: string;
}

const simulateServerSpin = async (forcedIndex: number | null): Promise<SpinResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Index 7 (iPhone 17) is STRICTLY excluded from the selection pool
      const secureAllowedIndices = [0, 1, 2, 3, 4, 5, 6];

      let finalIndex: number;

      if (forcedIndex !== null) {
        // Validation check: Server ignores attempts to force Index 7
        if (forcedIndex === 7) {
          console.warn("Server Rejected: Attempt to force selection of blacklisted Index 7 (iPhone 17). Falling back to random selection.");
          const fallbackIdx = secureAllowedIndices[Math.floor(Math.random() * secureAllowedIndices.length)];
          finalIndex = fallbackIdx;
        } else {
          finalIndex = forcedIndex;
        }
      } else {
        // Standard random selection from the safe index pool
        const randomIndex = Math.floor(Math.random() * secureAllowedIndices.length);
        finalIndex = secureAllowedIndices[randomIndex];
      }

      const mockTxId = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const mockSignature = `hmac_sha256_${Math.random().toString(16).substring(2, 18)}`;

      resolve({
        winningIndex: finalIndex,
        transactionId: mockTxId,
        signature: mockSignature,
        serverTimestamp: new Date().toISOString()
      });
    }, 700); // 700ms simulated API network latency
  });
};

export default function SpinWheel() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const forcedIndex = null;

  // Wheel animation states
  const [wheelRotation, setWheelRotation] = useState(0);
  const [pointerAngle, setPointerAngle] = useState(0);

  const lastPegIndex = useRef(0);
  const wiggleTimeoutRef = useRef<any>(null);
  const lastClickTime = useRef(0);

  const controls = useAnimation();

  // Simulated console logs (removed as Dev Console is gone, but keeping addLog function for simulated server logs)
  const addLog = (message: string) => {
    console.log(message);
  };

  // Synthesized Web Audio API sound effects (Singleton Context to prevent context limit errors)
  const getAudioContext = () => {
    if (!(window as any).globalAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        (window as any).globalAudioCtx = new AudioContextClass();
      }
    }
    return (window as any).globalAudioCtx as AudioContext;
  };

  const playTickSound = () => {
    if (!soundEnabled) return;
    const now = performance.now();
    if (now - lastClickTime.current < 45) return; // Throttle overlapping sounds
    lastClickTime.current = now;

    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(560, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // Autoplay blocker handle
    }
  };

  const playWinSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      // Play a quick celebratory major chord
      playTone(523.25, 0, 0.25);    // C5
      playTone(659.25, 0.12, 0.25); // E5
      playTone(783.99, 0.24, 0.3);  // G5
      playTone(1046.50, 0.36, 0.6); // C6
    } catch (e) { }
  };

  // SVG sector path generator
  // Calculations for 8 segments (45 degrees each), centered around x-axis (from -22.5 to +22.5 degrees)
  // R = 240
  // cos(22.5) = 0.92388, sin(22.5) = 0.38268
  // Arc starts at (R*cos(-22.5), R*sin(-22.5)) = (221.73, -91.84)
  // Arc ends at   (R*cos(22.5),  R*sin(22.5))  = (221.73,  91.84)
  const pathData = "M 0 0 L 221.73 -91.84 A 240 240 0 0 1 221.73 91.84 Z";

  const handleSpin = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowModal(false);
    setWinningIndex(null);
    setTransactionId(null);

    addLog("API Request initiated: POST /api/wheel/spin");
    addLog(`Override selection state: ${forcedIndex !== null ? `Forced index [${forcedIndex}]` : "None"}`);

    try {
      // Fetch spin result from mock secure server
      const response = await simulateServerSpin(forcedIndex);

      addLog(`API Response: Code 200 OK.`);
      addLog(`Secure TxID: ${response.transactionId}`);
      addLog(`Winning Segment Determined: [${response.winningIndex}] (${SEGMENTS[response.winningIndex].label})`);
      addLog(`Crypto Signature Verified: ${response.signature.substring(0, 16)}...`);

      setWinningIndex(response.winningIndex);
      setTransactionId(response.transactionId);

      // Determine final rotation value
      // Peg is at the top (270 degrees)
      const targetOffset = (270 - response.winningIndex * 45 + 360) % 360;
      const currentModulo = wheelRotation % 360;

      // Make it spin 5 full rotations (1800 deg) plus the offset
      const additionalRotation = 1800 + (targetOffset - currentModulo);
      const nextRotation = wheelRotation + additionalRotation;

      addLog(`Calculation: Current Angle = ${wheelRotation.toFixed(1)}°, Next Target Angle = ${nextRotation.toFixed(1)}°`);

      // Reset last peg pointer
      lastPegIndex.current = Math.floor((wheelRotation + 22.5) / 45);

      // Animate the wheel rotation
      controls.start({
        rotate: nextRotation,
        transition: {
          duration: 5.5,
          ease: [0.15, 0.85, 0.2, 1] // Custom ease curve for long cinematic slowdown
        }
      });

      setWheelRotation(nextRotation);

    } catch (error) {
      addLog("Server connection failure. Reverting state.");
      setIsSpinning(false);
    }
  };

  const triggerConfetti = () => {
    // Custom premium color scheme: Rose Gold, Pink, Ivory
    const colors = ['#FDE1E6', '#E0A6AA', '#FFF', '#B5727A', '#ffb6c1'];

    // Main explosion
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.55 },
      colors
    });

    // Elegant side showers
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.65 },
        colors
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.65 },
        colors
      });
    }, 350);
  };

  const handleAnimationComplete = () => {
    setIsSpinning(false);
    setShowModal(true);
    addLog(`Anticipation completed. Displaying award modal.`);
    triggerConfetti();
    playWinSound();
  };

  return (
    <div className="w-full min-h-screen bg-transparent text-slate-900 py-12 px-4 md:px-8">

      {/* Header Info */}
      <header className="max-w-6xl mx-auto flex justify-center text-center mb-10">
        <img src={citynutsLogo} alt="Citynuts Logo" className="h-24 md:h-32 object-contain drop-shadow-sm mb-4" />
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl mx-auto flex flex-col items-center mb-12">

        {/* Left Column: The Wheel & Interaction */}
        <section className="w-full flex flex-col items-center rounded-[3rem] p-6 md:p-12 relative overflow-hidden">

          {/* Subtle background glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-pink-400/20 blur-3xl pointer-events-none"
            animate={isSpinning ? {} : { scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* HUD info */}
          <div className="w-full flex justify-end items-center mb-10 z-10">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 rounded-full bg-white hover:bg-pink-50 transition-colors border border-pink-200 text-rose-500 hover:text-rose-600 cursor-pointer shadow-sm"
              title={soundEnabled ? "Mute audio" : "Unmute audio"}
              id="btn-sound-toggle"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>

          {/* Wheel Frame */}
          <div className="relative w-full max-w-[700px] aspect-square flex items-center justify-center p-2 mb-10 select-none">
            {/* Wooden Base Pedestal Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ffe4e6] via-[#ffffff] to-[#ffe4e6] p-3 shadow-[0_12px_45px_rgba(225,182,193,0.65)] border border-pink-200" />
            {/* Inner rim background */}
            <div className="absolute inset-2 rounded-full bg-[#fff0f5] border border-pink-300/50 shadow-inner" />

            {/* Pointer / Needle at top */}
            <motion.div
              className="absolute top-[-8px] left-1/2 z-20 w-20 h-24 pointer-events-none origin-top -ml-10"
              style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.55))' }}
              animate={{ rotate: pointerAngle }}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 14
              }}
            >
              <svg viewBox="0 0 50 70" className="w-full h-full">
                {/* Needle outer */}
                <path
                  d="M25 65 L8 18 A 18 18 0 0 1 42 18 Z"
                  fill="url(#needleGoldGradient)"
                  stroke="#E0A6AA"
                  strokeWidth="2.5"
                />
                {/* Needle core */}
                <path
                  d="M25 58 L14 20 A 12 12 0 0 1 36 20 Z"
                  fill="#fff0f5"
                  stroke="#FDE1E6"
                  strokeWidth="1"
                />
                {/* Pivot gem */}
                <circle cx="25" cy="20" r="5" fill="#fb7185" stroke="#fff" strokeWidth="0.5" />
                <defs>
                  <linearGradient id="needleGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF" />
                    <stop offset="50%" stopColor="#FDE1E6" />
                    <stop offset="100%" stopColor="#E0A6AA" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            {/* Canvas Wheel */}
            <div className="relative w-full h-full p-2 z-10">
              <svg
                viewBox="-250 -250 500 500"
                className="w-full h-full overflow-visible drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              >
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="50%" stopColor="#FDE1E6" />
                    <stop offset="100%" stopColor="#E0A6AA" />
                  </linearGradient>
                  <radialGradient id="rimShadow" cx="50%" cy="50%" r="50%">
                    <stop offset="90%" stopColor="#000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
                  </radialGradient>

                  {/* Segment Gradients */}
                  <radialGradient id="grad-emerald" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </radialGradient>
                  <radialGradient id="grad-gold" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                  </radialGradient>
                  <radialGradient id="grad-ruby" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#9f1239" />
                  </radialGradient>
                  <radialGradient id="grad-sapphire" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </radialGradient>
                  <radialGradient id="grad-amethyst" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6b21a8" />
                  </radialGradient>
                  <radialGradient id="grad-dark" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#52525b" />
                    <stop offset="100%" stopColor="#27272a" />
                  </radialGradient>
                  
                  <clipPath id="image-clip">
                    <circle cx="0" cy="0" r="14" />
                  </clipPath>
                </defs>

                <circle r="248" fill="none" stroke="url(#goldGradient)" strokeWidth="6" />
                <circle r="245" fill="#fff5f7" />

                {/* Rotating Wedge Container */}
                <motion.g
                  animate={controls}
                  onUpdate={(latest) => {
                    const rot = typeof latest.rotate === 'number' ? latest.rotate : parseFloat((latest.rotate as string) || '0');
                    const currentPeg = Math.floor((rot + 22.5) / 45);
                    if (currentPeg !== lastPegIndex.current) {
                      lastPegIndex.current = currentPeg;
                      setPointerAngle(-16);
                      if (wiggleTimeoutRef.current) clearTimeout(wiggleTimeoutRef.current);
                      wiggleTimeoutRef.current = setTimeout(() => setPointerAngle(0), 75);
                      playTickSound();
                    }
                  }}
                  onAnimationComplete={handleAnimationComplete}
                  style={{ transformOrigin: '0px 0px' }}
                >
                  {SEGMENTS.map((seg, idx) => {
                    const angle = idx * 45;
                    return (
                      <g key={idx} transform={`rotate(${angle})`}>
                        {/* Wedge slice */}
                        <path
                          d={pathData}
                          fill={seg.color}
                          stroke="url(#goldGradient)"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />

                        {/* Gold overlay for iPhone segment */}
                        {idx === 7 && (
                          <path
                            d={pathData}
                            fill="url(#goldGradient)"
                            opacity="0.18"
                            style={{ mixBlendMode: 'overlay' }}
                          />
                        )}

                        {/* Outer peg */}
                        <circle
                          cx="241"
                          cy="0"
                          r="4"
                          fill="url(#goldGradient)"
                          stroke="#fff"
                          strokeWidth="1"
                          transform="rotate(22.5)"
                        />

                        {/* Text Label */}
                        <g transform="translate(130, 0)">
                          <text
                            fill={seg.textColor}
                            fontSize="12.5"
                            fontWeight="800"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="select-none font-sans tracking-wide"
                            transform="rotate(0)"
                          >
                            {seg.label}
                          </text>
                        </g>

                        {/* Image */}
                        <g transform="translate(195, 0) rotate(90)">
                          <image
                            href={seg.image}
                            x="-14"
                            y="-14"
                            height="28"
                            width="28"
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="url(#image-clip)"
                            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
                          />
                        </g>
                      </g>
                    );
                  })}
                </motion.g>

                <circle r="245" fill="url(#rimShadow)" pointerEvents="none" />

                {/* Perimeter LEDs */}
                {Array.from({ length: 24 }).map((_, idx) => {
                  const angle = idx * 15;
                  const rad = (angle * Math.PI) / 180;
                  const bulbX = 243.5 * Math.cos(rad);
                  const bulbY = 243.5 * Math.sin(rad);

                  return (
                    <motion.circle
                      key={`bulb-${idx}`}
                      cx={bulbX}
                      cy={bulbY}
                      r="4"
                      stroke="#E0A6AA"
                      strokeWidth="1"
                      initial={{ fill: "#fff", filter: "drop-shadow(0 0 6px #FDE1E6)" }}
                      animate={
                        isSpinning
                          ? {
                            fill: ["#ffb6c1", "#fff", "#ffb6c1"],
                            filter: ["drop-shadow(0 0 0px #FDE1E6)", "drop-shadow(0 0 10px #FDE1E6)", "drop-shadow(0 0 0px #FDE1E6)"]
                          }
                          : {
                            fill: ["#fff", "#ffe4e6", "#fff"],
                            filter: ["drop-shadow(0 0 6px #FDE1E6)", "drop-shadow(0 0 12px #FDE1E6)", "drop-shadow(0 0 6px #FDE1E6)"]
                          }
                      }
                      transition={
                        isSpinning
                          ? { duration: 0.3, repeat: Infinity, delay: idx * 0.03, ease: "linear" }
                          : { duration: 2, repeat: Infinity, delay: idx * 0.1, ease: "easeInOut" }
                      }
                    />
                  );
                })}

                {/* Center Hub - Premium 3D Redesign */}
                <g filter="drop-shadow(0 15px 20px rgba(90,42,56,0.15))">
                  <circle r="48" fill="url(#roseGoldLine)" stroke="#B37C8A" strokeWidth="1" />
                  <circle r="44" fill="#FFFFFF" stroke="#F4D0C9" strokeWidth="1" opacity="0.95" />
                  <circle r="38" fill="url(#roseGoldLine)" />
                  <circle r="34" fill="#FFFBF9" stroke="rgba(217,168,180,0.6)" strokeWidth="1" />
                  
                  <image
                    href={citynutsLogo}
                    x="-24"
                    y="-24"
                    height="48"
                    width="48"
                    preserveAspectRatio="xMidYMid meet"
                  />
                  
                  <circle r="30" fill="none" stroke="rgba(217, 168, 180, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                </g>
              </svg>
            </div>
          </div>
          {/* SPIN ACTION BUTTON */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full max-w-[400px] relative py-5 px-8 rounded-2xl font-bold uppercase tracking-wider text-base transition-all duration-300 transform border shadow-xl cursor-pointer ${isSpinning
                ? 'bg-rose-100 border-rose-200 text-rose-400 scale-98 cursor-wait'
                : 'bg-gradient-to-r from-rose-300 via-pink-400 to-rose-500 hover:from-rose-400 hover:to-pink-500 border-rose-300 text-white active:scale-95 hover:shadow-rose-400/40 hover:shadow-2xl'
              }`}
            id="btn-spin-wheel"
          >
            <span className="flex items-center justify-center gap-3">
              <Sparkles size={20} className={isSpinning ? "animate-spin" : ""} />
              {isSpinning ? "Spinning..." : "Spin the Wheel"}
            </span>
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="max-w-4xl mx-auto text-center border-t border-pink-200 pt-8 pb-4 text-pink-600/60 text-sm font-light">
        <p>&copy; {new Date().getFullYear()} citynuts. All rights reserved.</p>
      </footer>

      {/* CONGRATULATIONS MODAL */}
      {showModal && winningIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          id="congrats-modal"
        >
          <div className="absolute inset-0" onClick={() => setShowModal(false)} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative max-w-md w-full rounded-3xl p-8 border border-pink-200 bg-white/90 backdrop-blur-xl text-center shadow-[0_20px_80px_rgba(255,182,193,0.3)] overflow-hidden z-10"
          >
            {/* Top gold bar detail */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-300 via-pink-400 to-rose-500" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-400/10 blur-3xl pointer-events-none" />

            {/* Glowing Icon Frame */}
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-b from-rose-100 to-transparent flex items-center justify-center border border-pink-200 mb-6 shadow-lg relative">
              <img src={SEGMENTS[winningIndex].image} className="w-14 h-14 rounded-full shadow-md object-cover" alt="" />
              <div className="absolute inset-0 rounded-full border border-pink-300 animate-ping opacity-25" />
            </div>

            {/* Typography */}
            <span className="text-xs uppercase tracking-[0.25em] text-rose-500 font-bold block mb-1">
              Reward Unlocked
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-slate-800 mb-2 leading-tight">
              {SEGMENTS[winningIndex].label === "Better Luck Next Time" ? "Thanks for Spinning!" : "Congratulations!"}
            </h2>

            <p className="text-sm text-slate-600 mb-6 max-w-xs mx-auto leading-relaxed">
              {SEGMENTS[winningIndex].label === "Better Luck Next Time"
                ? SEGMENTS[winningIndex].description
                : <>You've won <span className="text-rose-600 font-bold">{SEGMENTS[winningIndex].label}</span>. {SEGMENTS[winningIndex].description}</>}
            </p>

            <div className="flex items-center justify-center gap-1 text-[9px] text-pink-400 font-mono mb-6 uppercase tracking-wider">
              <span>Security verified: {transactionId || 'N/A'}</span>
            </div>

            {/* Modal Controls */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="py-3 px-4 rounded-xl border border-pink-200 hover:bg-pink-50 transition-colors font-bold text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                id="btn-close-modal"
              >
                Close View
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  handleSpin();
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-rose-500 border border-rose-400 hover:bg-rose-600 text-white shadow-md shadow-rose-200"
                id="btn-modal-spin-again"
              >
                <RotateCcw size={12} />
                <span>Spin Again</span>
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}
