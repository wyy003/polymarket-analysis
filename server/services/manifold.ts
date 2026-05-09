import axios from 'axios';

const MANIFOLD_API_BASE = 'https://api.manifold.markets/v0';

export interface ManifoldMarket {
  id: string;
  question: string;
  outcomeType: 'BINARY' | 'MULTIPLE_CHOICE' | 'FREE_RESPONSE' | 'NUMERIC';
  probability?: number;
  answers?: ManifoldAnswer[];
  url: string;
  createdTime: number;
  closeTime?: number;
  isResolved: boolean;
  resolution?: string;
  volume: number;
  volume24Hours: number;
}

export interface ManifoldAnswer {
  id: string;
  text: string;
  probability: number;
  poolYes?: number;
  poolNo?: number;
}

/**
 * Fetch market details by ID
 */
export async function getMarket(marketId: string): Promise<ManifoldMarket | null> {
  try {
    const response = await axios.get(`${MANIFOLD_API_BASE}/market/${marketId}`, {
      timeout: 10000,
    });

    return response.data || null;
  } catch (error) {
    console.error(`Error fetching Manifold market ${marketId}:`, error);
    throw error;
  }
}

/**
 * Get probability for a specific answer in a multi-choice market
 */
export async function getAnswerProbability(
  marketId: string,
  answerId: string
): Promise<number | null> {
  try {
    const market = await getMarket(marketId);

    if (!market || market.outcomeType !== 'MULTIPLE_CHOICE') {
      return null;
    }

    const answer = market.answers?.find(a => a.id === answerId);
    return answer?.probability ?? null;
  } catch (error) {
    console.error(`Error fetching Manifold answer probability:`, error);
    throw error;
  }
}

/**
 * Search markets by term
 */
export async function searchMarkets(
  term: string,
  limit = 10
): Promise<ManifoldMarket[]> {
  try {
    const response = await axios.get(`${MANIFOLD_API_BASE}/search-markets`, {
      params: { term, limit },
      timeout: 10000,
    });

    return response.data || [];
  } catch (error) {
    console.error(`Error searching Manifold markets:`, error);
    throw error;
  }
}

/**
 * Get multiple markets by IDs
 */
export async function getMarkets(marketIds: string[]): Promise<ManifoldMarket[]> {
  try {
    const promises = marketIds.map(id => getMarket(id));
    const results = await Promise.all(promises);
    return results.filter((m): m is ManifoldMarket => m !== null);
  } catch (error) {
    console.error(`Error fetching Manifold markets:`, error);
    throw error;
  }
}
