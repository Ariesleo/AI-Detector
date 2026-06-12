// In-memory session state: pending image handoff (home → analyzing) and
// report cache for instant navigation. Persistent copies live in storage.ts.
import type { PickedImage } from "./api";
import type { AnalysisReport } from "./types";

const reports = new Map<string, AnalysisReport>();
const imageUris = new Map<string, string>();
let pendingImage: PickedImage | null = null;

export function setPendingImage(img: PickedImage | null): void {
  pendingImage = img;
}

export function getPendingImage(): PickedImage | null {
  return pendingImage;
}

export function saveReport(report: AnalysisReport, imageUri: string): void {
  reports.set(report.report_id, report);
  imageUris.set(report.report_id, imageUri);
}

export function getReport(id: string): AnalysisReport | undefined {
  return reports.get(id);
}

export function getImageUri(id: string): string | undefined {
  return imageUris.get(id);
}
