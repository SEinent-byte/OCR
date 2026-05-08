import { Howl } from "howler";
import { useMemo } from "react";

function createTone(frequency, durationMs = 0.08, type = "sine") {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationMs);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, totalSamples * 2, true);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-8 * t);
    const wave =
      type === "triangle"
        ? 2 * Math.asin(Math.sin(2 * Math.PI * frequency * t)) / Math.PI
        : Math.sin(2 * Math.PI * frequency * t);
    const sample = Math.max(-1, Math.min(1, wave * env));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export function useSounds() {
  const sounds = useMemo(
    () => ({
      click: new Howl({ src: [createTone(520, 0.07)] }),
      success: new Howl({ src: [createTone(760, 0.09)] }),
      warning: new Howl({ src: [createTone(340, 0.1, "triangle")] }),
      error: new Howl({ src: [createTone(220, 0.13, "triangle")] }),
      hover: new Howl({ src: [createTone(630, 0.04)] }),
    }),
    []
  );

  return {
    playClick: () => sounds.click.play(),
    playSuccess: () => sounds.success.play(),
    playWarning: () => sounds.warning.play(),
    playError: () => sounds.error.play(),
    playHover: () => sounds.hover.play(),
  };
}
