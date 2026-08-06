import type { MarketDecision } from "@/lib/decision/types";
import type {NewsSentimentResponse} from "@/lib/sentiment";

export type BiasResponse = {
  btcPrice: number
  solPrice: number
  headlines: string[]
  macro: string
  technical: string
  sentiment: NewsSentimentResponse | null
  decision: MarketDecision | null
}