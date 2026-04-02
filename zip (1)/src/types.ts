export interface Stock {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
}

export interface PortfolioItem {
  symbol: string;
  shares: number;
  averagePrice: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  timestamp: number;
  totalAmount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: number;
}

export interface UserState {
  balance: number;
  portfolio: PortfolioItem[];
  transactions: Transaction[];
  achievements: Achievement[];
  buyStock: (symbol: string, shares: number, price: number) => void;
  sellStock: (symbol: string, shares: number, price: number) => void;
  checkAchievements: (currentPortfolioValue: number) => void;
  resetAccount: () => void;
}
