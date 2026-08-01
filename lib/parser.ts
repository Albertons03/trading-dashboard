export type Decision = {
  bias: string;
  confidence: number;
  quality: string;
  action: string;
  entry: number;
  sl: number;
  tp: number;
  reason: string;
};

export function parseDecision(text: string): Decision | null {
  try {
    const json = JSON.parse(text);
    return {
      bias: json.bias ?? "",
      confidence: Number(json.confidence) || 0,
      quality: json.quality ?? "",
      action: json.action ?? "",
      entry: Number(json.entry) || 0,
      sl: Number(json.stopLoss) || 0,
      tp: Number(json.target) || 0,
      reason: json.reason ?? "",
    };
  } catch {
    // Ha valami miatt az AI nem adott vissza valid JSON-t
    console.error("Decision parse error – raw text:", text);
    return null;
  }
}
