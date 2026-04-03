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

export interface TabComponentProps {
  setActiveTab?: (tab: string) => void;
  pinnedToolIds?: string[];
  togglePinTool?: (id: string) => void;
  selectedToolId?: string | null;
  onToolOpen?: () => void;
  onLogout?: () => void;
  user?: any;
  profile?: any;
}

export interface Tab {
  id: string;
  label: string;
  icon: any;
  component: any;
}

export interface ToolMetadata {
  id: string;
  title: string;
  icon: any;
  description: string;
  color: string;
  component: any;
}
