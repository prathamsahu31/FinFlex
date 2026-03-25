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
import EMICalculator from './EMICalculator';
import FIRECalculator from './FIRECalculator';
import SubscriptionTracker from './SubscriptionTracker';
import CurrencyConverter from './CurrencyConverter';
import TaxEstimator from './TaxEstimator';
import BudgetPlanner from './BudgetPlanner';

export interface TabComponentProps {
  setActiveTab?: (tab: string) => void;
  pinnedToolIds?: string[];
  togglePinTool?: (id: string) => void;
  defaultToolId?: string | null;
  onToolOpen?: () => void;
}

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'tools', label: 'Explore Tools', icon: Wrench, component: Tools },
];

export const TOOLS_METADATA: any[] = [
  { id: 'transactions', title: 'Transactions', icon: CreditCard, description: 'Manage your income and expenses', color: 'bg-gumroad-pink text-black', component: Transactions },
  { id: 'bill-split', title: 'Bill Split', icon: Users, description: 'Split bills with friends', color: 'bg-gumroad-yellow text-black', component: BillSplit },
  { id: 'portfolio', title: 'Portfolio & FIRE', icon: TrendingUp, description: 'Track your assets and retirement', color: 'bg-white text-black', component: Portfolio },
  { id: 'flex-decks', title: 'Flex-Decks', icon: BookOpen, description: 'Learn finance with flashcards', color: 'bg-gumroad-pink text-black', component: FlexDecks },
  { id: 'ai-agent', title: 'FinFlex AI', icon: Bot, description: 'Your personal financial AI', color: 'bg-gumroad-yellow text-black', component: AIAgent },
  { id: 'emi', title: 'EMI Calculator', icon: Calculator, description: 'Calculate your monthly loan EMIs', color: 'bg-gumroad-pink text-black', component: EMICalculator },
  { id: 'fire', title: 'FIRE Calculator', icon: Target, description: 'Plan your early retirement', color: 'bg-gumroad-yellow text-black', component: FIRECalculator },
  { id: 'subs', title: 'Subscriptions', icon: Repeat, description: 'Track your recurring payments', color: 'bg-black text-white', component: SubscriptionTracker },
  { id: 'currency', title: 'Currency Converter', icon: DollarSign, description: 'Real-time exchange rates', color: 'bg-white text-black', component: CurrencyConverter },
  { id: 'tax', title: 'Tax Estimator', icon: PieChart, description: 'Estimate your annual taxes', color: 'bg-gumroad-pink text-black', component: TaxEstimator },
  { id: 'budget', title: 'Budget Planner', icon: CreditCard, description: '50/30/20 rule calculator', color: 'bg-gumroad-yellow text-black', component: BudgetPlanner },
];
