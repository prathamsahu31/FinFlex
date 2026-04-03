import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserState, PortfolioItem, Transaction, Achievement } from './types';

const INITIAL_BALANCE = 1000;

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      balance: INITIAL_BALANCE,
      portfolio: [],
      transactions: [],
      achievements: [],

      buyStock: (symbol, shares, price) => {
        const totalCost = shares * price;
        const { balance, portfolio, transactions } = get();

        if (balance < totalCost) {
          throw new Error('Insufficient funds');
        }

        const existingItem = portfolio.find(p => p.symbol === symbol);
        let newPortfolio: PortfolioItem[];

        if (existingItem) {
          const totalShares = existingItem.shares + shares;
          const totalInvested = (existingItem.shares * existingItem.averagePrice) + totalCost;
          newPortfolio = portfolio.map(p => 
            p.symbol === symbol 
              ? { ...p, shares: totalShares, averagePrice: totalInvested / totalShares }
              : p
          );
        } else {
          newPortfolio = [...portfolio, { symbol, shares, averagePrice: price }];
        }

        const newTransaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          symbol,
          type: 'BUY',
          shares,
          price,
          timestamp: Date.now(),
          totalAmount: totalCost
        };

        set({
          balance: balance - totalCost,
          portfolio: newPortfolio,
          transactions: [newTransaction, ...transactions]
        });
      },

      sellStock: (symbol, shares, price) => {
        const { balance, portfolio, transactions } = get();
        const existingItem = portfolio.find(p => p.symbol === symbol);

        if (!existingItem || existingItem.shares < shares) {
          throw new Error('Insufficient shares');
        }

        const totalRevenue = shares * price;
        let newPortfolio: PortfolioItem[];

        if (existingItem.shares === shares) {
          newPortfolio = portfolio.filter(p => p.symbol !== symbol);
        } else {
          newPortfolio = portfolio.map(p => 
            p.symbol === symbol 
              ? { ...p, shares: p.shares - shares }
              : p
          );
        }

        const newTransaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          symbol,
          type: 'SELL',
          shares,
          price,
          timestamp: Date.now(),
          totalAmount: totalRevenue
        };

        set({
          balance: balance + totalRevenue,
          portfolio: newPortfolio,
          transactions: [newTransaction, ...transactions]
        });
      },

      checkAchievements: (currentPortfolioValue) => {
        const { transactions, achievements, balance } = get();
        const newAchievements: Achievement[] = [];

        const hasAchievement = (id: string) => achievements.some(a => a.id === id);

        // First Trade
        if (transactions.length > 0 && !hasAchievement('first_trade')) {
          newAchievements.push({
            id: 'first_trade',
            title: 'First Trade',
            description: 'You made your first stock trade!',
            unlockedAt: Date.now()
          });
        }

        // 10% Profit (Total Value > 1100)
        const totalValue = balance + currentPortfolioValue;
        if (totalValue >= 1100 && !hasAchievement('profit_10')) {
          newAchievements.push({
            id: 'profit_10',
            title: '10% Profit',
            description: 'You grew your initial balance by 10%!',
            unlockedAt: Date.now()
          });
        }

        // Portfolio > 2000
        if (totalValue >= 2000 && !hasAchievement('whale')) {
          newAchievements.push({
            id: 'whale',
            title: 'Whale Alert',
            description: 'Your total value exceeded 2000 points!',
            unlockedAt: Date.now()
          });
        }

        if (newAchievements.length > 0) {
          set({ achievements: [...achievements, ...newAchievements] });
        }
      },

      resetAccount: () => {
        set({
          balance: INITIAL_BALANCE,
          portfolio: [],
          transactions: [],
          achievements: []
        });
      }
    }),
    {
      name: 'stock-market-storage',
    }
  )
);
