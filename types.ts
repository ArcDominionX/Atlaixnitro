export type ViewState = 
  | 'auth' 
  | 'overview' 
  | 'token-details'
  | 'kol-feed' 
  | 'heatmap' 
  | 'sentiment' 
  | 'detection' 
  | 'token-detection' 
  | 'virality' 
  | 'chatbot' 
  | 'wallet-tracking' 
  | 'smart-money' 
  | 'safe-scan' 
  | 'custom-alerts' 
  | 'settings';

export interface Wallet {
  id: number;
  addr: string;
  tag: string;
  bal: string;
  pnl: string;
  win: string;
  tokens: number;
  time: string;
  type: 'whale' | 'smart' | 'sniper';
}

export interface MarketCoin {
  id: number;
  name: string;
  ticker: string;
  price: string;
  h1: string;
  h24: string;
  d7: string;
  cap: string;
  liquidity: string;
  volume24h: string; 
  dexBuys: string; 
  dexSells: string;
  dexFlow: number; 
  netFlow: string; 
  smartMoney: string; 
  smartMoneySignal: 'Inflow' | 'Outflow' | 'Neutral';
  signal: 'Volume Spike' | 'Accumulation' | 'Breakout' | 'Dump' | 'None';
  riskLevel: 'Low' | 'Medium' | 'High';
  age: string;
  createdTimestamp: number;
  img: string;
  trend: 'Bullish' | 'Bearish';
  chain: string;
  address?: string;     
  pairAddress?: string; 
}

export interface Post {
  id: number;
  user: string;
  handle: string;
  avatar: string;
  time: string;
  content: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  likes: number;
  retweets: number;
  replies: number;
  smart: boolean;
  platform: 'twitter' | 'telegram';
  aiInsight?: string;
  aiExpanded: boolean;
}