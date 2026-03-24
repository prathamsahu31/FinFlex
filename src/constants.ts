import { 
  LayoutDashboard, CreditCard, TrendingUp, BookOpen, Bot,
  Wrench, Users, User as UserIcon, Calculator, Target, Repeat, DollarSign, PieChart
} from 'lucide-react';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import Portfolio from './Portfolio';
import FlexDecks from './FlexDecks';
import AIAgent from './AIAgent';
import Tools from './Tools';
import BillSplit from './BillSplit';
import ProfileSettings from './ProfileSettings';

export interface TabComponentProps {
  setActiveTab?: (tab: string) => void;
  pinnedToolIds?: string[];
  togglePinTool?: (id: string) => void;
  defaultToolId?: string | null;
  onToolOpen?: () => void;
}

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'transactions', label: 'Transactions', icon: CreditCard, component: Transactions },
  { id: 'bill-split', label: 'Bill Split', icon: Users, component: BillSplit },
  { id: 'portfolio', label: 'Portfolio & FIRE', icon: TrendingUp, component: Portfolio },
  { id: 'flex-decks', label: 'Flex-Decks', icon: BookOpen, component: FlexDecks },
  { id: 'ai-agent', label: 'AI Agent', icon: Bot, component: AIAgent },
  { id: 'tools', label: 'Tools', icon: Wrench, component: Tools },
  { id: 'settings', label: 'Settings', icon: UserIcon, component: ProfileSettings },
];

export const TOOLS_METADATA = [
  { id: 'emi', title: 'EMI Calculator', icon: Calculator, description: 'Calculate your monthly loan EMIs', color: 'bg-gumroad-pink text-black' },
  { id: 'fire', title: 'FIRE Calculator', icon: Target, description: 'Plan your early retirement', color: 'bg-gumroad-yellow text-black' },
  { id: 'subs', title: 'Subscriptions', icon: Repeat, description: 'Track your recurring payments', color: 'bg-black text-white' },
  { id: 'currency', title: 'Currency Converter', icon: DollarSign, description: 'Real-time exchange rates', color: 'bg-white text-black' },
  { id: 'tax', title: 'Tax Estimator', icon: PieChart, description: 'Estimate your annual taxes', color: 'bg-gumroad-pink text-black' },
  { id: 'budget', title: 'Budget Planner', icon: CreditCard, description: '50/30/20 rule calculator', color: 'bg-gumroad-yellow text-black' },
];
