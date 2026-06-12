import { Platform } from "react-native";
import { getSettings } from "./storage";
import type { AnalysisReport } from "./types";

// Priority: Settings screen override → env var → localhost.
// Web/simulator: localhost works. Physical device: set your machine's LAN IP, e.g.
//   EXPO_PUBLIC_API_URL=http://192.168.1.20:8000 npx expo start
export function getApiUrl(): string {
  return (
    getSettings().apiUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    "http://localhost:8000"
  );
}

export interface PickedImage {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function analyzeImage(img: PickedImage): Promise<AnalysisReport> {
  const form = new FormData();
  const name = img.fileName ?? "upload.jpg";
  const type = img.mimeType ?? guessMime(name);

  if (Platform.OS === "web") {
    // On web the picker returns a blob/data URI — convert to a real Blob.
    const blob = await (await fetch(img.uri)).blob();
    form.append("file", new File([blob], name, { type }));
  } else {
    // React Native FormData file shape.
    form.append("file", { uri: img.uri, name, type } as unknown as Blob);
  }

  const res = await fetch(`${getApiUrl()}/v1/analyze`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Analysis failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as AnalysisReport;
}

function guessMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  return (
    {
      png: "image/png",
      webp: "image/webp",
      tif: "image/tiff",
      tiff: "image/tiff",
      heic: "image/heic",
    }[ext ?? ""] ?? "image/jpeg"
  );
}
