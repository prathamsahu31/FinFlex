import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
try {
  yahooFinance.quote('AAPL').then(console.log).catch(console.error);
} catch (e) {
  console.error(e);
}
