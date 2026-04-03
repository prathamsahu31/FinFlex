import { lazy } from 'react';
import { 
  LayoutDashboard, CreditCard, TrendingUp, BookOpen, Bot,
  Wrench, Users, User as UserIcon, Calculator, Target, Repeat, DollarSign, PieChart, ShieldAlert, Gavel
} from 'lucide-react';
import { LineChart } from 'lucide-react';

// Eagerly loaded core components
import Dashboard from './Dashboard';
import Trading from './Trading';
import Tools from './Tools';

// Tools eagerly loaded for instant access (Top most used)
import Transactions from './Transactions';
import BudgetPlanner from './BudgetPlanner';
import AIAgent from './AIAgent';
import ProfileSettings from './ProfileSettings';

// Lazy loaded niche tools
const Portfolio = lazy(() => import('./Portfolio'));
const FlexDecks = lazy(() => import('./FlexDecks'));
const BillSplit = lazy(() => import('./BillSplit'));
const EMICalculator = lazy(() => import('./EMICalculator'));
const FIRECalculator = lazy(() => import('./FIRECalculator'));
const SubscriptionTracker = lazy(() => import('./SubscriptionTracker'));
const CurrencyConverter = lazy(() => import('./CurrencyConverter'));
const TaxEstimator = lazy(() => import('./TaxEstimator'));
const CompoundInterest = lazy(() => import('./CompoundInterest'));
const PunishmentContract = lazy(() => import('./PunishmentContract'));

export { ProfileSettings };

export interface TabComponentProps {
  setActiveTab?: (tab: string) => void;
  pinnedToolIds?: string[];
  togglePinTool?: (id: string) => void;
  defaultToolId?: string | null;
  onToolOpen?: () => void;
  onLogout?: () => void;
}

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'trading', label: 'Trading Floor', icon: LineChart, component: Trading },
  { id: 'tools', label: 'Explore Tools', icon: Wrench, component: Tools },
];

export const TOOLS_METADATA: any[] = [
  // High Usability / Daily-Weekly Use
  { id: 'transactions', title: 'Transactions', icon: CreditCard, description: 'Manage your income and expenses', color: 'bg-gumroad-pink text-black', component: Transactions },
  { id: 'budget', title: 'Budget Planner', icon: PieChart, description: '50/30/20 rule calculator', color: 'bg-gumroad-yellow text-black', component: BudgetPlanner },
  { id: 'bill-split', title: 'Bill Split', icon: Users, description: 'Split bills with friends', color: 'bg-white text-black', component: BillSplit },
  
  // Financial Calculators / Planning
  { id: 'tax', title: 'Tax Estimator', icon: DollarSign, description: 'Estimate your annual taxes', color: 'bg-gumroad-yellow text-black', component: TaxEstimator },
  { id: 'emi', title: 'EMI Calculator', icon: Calculator, description: 'Calculate your monthly loan EMIs', color: 'bg-gumroad-pink text-black', component: EMICalculator },
  { id: 'compound', title: 'Compound Interest', icon: TrendingUp, description: 'Watch your wealth multiply', color: 'bg-black text-white hover:text-black', component: CompoundInterest },
  { id: 'currency', title: 'Currency Converter', icon: Repeat, description: 'Real-time exchange rates', color: 'bg-white text-black', component: CurrencyConverter },
  
  // Big Picture / Niche
  { id: 'portfolio', title: 'Portfolio & FIRE', icon: Target, description: 'Track your assets and retirement', color: 'bg-gumroad-yellow text-black', component: Portfolio },
  { id: 'fire', title: 'FIRE Calculator', icon: Target, description: 'Plan your early retirement', color: 'bg-gumroad-pink text-black', component: FIRECalculator },
  { id: 'subs', title: 'Subscriptions', icon: Repeat, description: 'Track your recurring payments', color: 'bg-white text-black', component: SubscriptionTracker },
  { id: 'flex-decks', title: 'Flex-Decks', icon: BookOpen, description: 'Learn finance with flashcards', color: 'bg-gumroad-pink text-black', component: FlexDecks },
  { id: 'ai-agent', title: 'FinFlex AI', icon: Bot, description: 'Your personal financial AI', color: 'bg-black text-white hover:text-black', component: AIAgent },
  { id: 'punishment', title: 'Punishment', icon: ShieldAlert, description: 'Pay for your financial sins', color: 'bg-gumroad-pink text-white hover:text-white', component: PunishmentContract },
];
