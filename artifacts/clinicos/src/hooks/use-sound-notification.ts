import { useCallback, useEffect, useRef, useState } from "react";

export type SoundType = "message" | "handoff" | "appointment" | "success";

const STORAGE_KEY = "clinicos_sound_muted";

export function useSoundNotification() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const playChime = useCallback(
    (type: SoundType = "message") => {
      if (isMuted || typeof window === "undefined") return;

      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioContextClass();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          void ctx.resume();
        }

        const now = ctx.currentTime;

        if (type === "handoff") {
          // Urgent but elegant multi-tone hospital alert: 523Hz (C5) -> 659Hz (E5) -> 783Hz (G5)
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + index * 0.12;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.001, start);
            gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.4);
          });
        } else if (type === "appointment") {
          // Soft double bell: 659.25Hz -> 523.25Hz
          const notes = [659.25, 523.25];
          notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + index * 0.15;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.001, start);
            gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.45);
          });
        } else {
          // Subtle, soft incoming message chime: 587.33Hz (D5) & 880Hz (A5)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(587.33, now);

          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(880, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.45);
          osc2.stop(now + 0.45);
        }
      } catch (err) {
        console.warn("[SoundNotification] AudioContext playback skipped", err);
      }
    },
    [isMuted],
  );

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  return { isMuted, toggleMute, playChime };
}
