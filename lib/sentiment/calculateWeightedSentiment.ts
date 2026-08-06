import { HeadlineSentimentItem } from "./types";

export function calculateWeightedSentiment(
  items: HeadlineSentimentItem[]
): number {
  const validItems = items.filter((item) => {
    return (
      !item.isDuplicate &&
      Number.isFinite(item.sentimentScore) &&
      Number.isFinite(item.btcRelevance) &&
      Number.isFinite(item.confidence) &&
      item.btcRelevance >= 0 &&
      item.btcRelevance <= 10 &&
      item.confidence >= 0 &&
      item.confidence <= 100 &&
      item.sentimentScore >= -100 &&
      item.sentimentScore <= 100
    );
  });

  if (validItems.length === 0) {
    return 0;
  }

  const totals = validItems.reduce(
    (acc, item) => {
      const relevanceWeight = item.btcRelevance / 10;
      const confidenceWeight = item.confidence / 100;
      const weight = relevanceWeight * confidenceWeight;

      return {
        weightedSum:
          acc.weightedSum + item.sentimentScore * weight,
        totalWeight: acc.totalWeight + weight,
      };
    },
    {
      weightedSum: 0,
      totalWeight: 0,
    }
  );

  if (totals.totalWeight === 0) {
    return 0;
  }

  const score = Math.round(totals.weightedSum / totals.totalWeight);

  return Math.max(-100, Math.min(100, score));
}



