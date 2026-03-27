import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import logoImg from './logo.png';

interface LoginProps {
  onBack?: () => void;
}

export default function Login({ onBack }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      alert("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorText(error.message);
    }
  };

  const handleGuestLogin = async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorText('');
    try {
      const credentials = { email: 'guest@finflex.com', password: '1234qwerty@' };
      const { error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) {
        // Fallback: auto-create the guest account if it does not exist
        const { error: signUpError } = await supabase.auth.signUp(credentials);
        if (signUpError) throw signUpError;
      }
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setErrorText('');
    setSuccessText('');
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        if (error) throw error;
        setSuccessText("Success! Please check your email inbox to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body antialiased flex flex-col justify-center py-12 sm:px-6 lg:px-8 grid-bg relative selection:bg-gumroad-pink selection:text-black">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 bg-white border-4 border-black px-6 py-2 font-headline font-black uppercase neo-brutalism-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all z-50 cursor-pointer">
          ← Back
        </button>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 border-4 border-black bg-gumroad-pink flex items-center justify-center text-black neo-brutalism-shadow-lg overflow-hidden p-2">
            <img 
              src={logoImg} 
              alt="FinFlex Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-5xl font-black font-headline text-black uppercase tracking-tight">
          {isSignUp ? 'Join the Movement' : 'Sign In'}
        </h2>
        <p className="mt-4 text-center text-lg md:text-xl font-bold text-black border-l-8 border-black pl-4 mx-4 bg-white py-2">
          Flex Financial Discipline. No jargon.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="bg-white py-8 px-4 sm:px-10 border-4 border-black neo-brutalism-shadow-lg mx-4 sm:mx-0">
          
          <form className="space-y-6" onSubmit={handleEmailAuth}>
            <div>
              <label className="block text-sm font-black font-label tracking-widest uppercase text-black mb-2">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-black" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border-4 border-black bg-white placeholder-black/50 focus:outline-none focus:ring-0 focus:bg-gumroad-yellow/20 font-bold text-black transition-colors"
                  placeholder="provocateur@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black font-label tracking-widest uppercase text-black mb-2">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-black" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border-4 border-black bg-white placeholder-black/50 focus:outline-none focus:ring-0 focus:bg-gumroad-pink/20 font-bold text-black transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {errorText && (
              <div className="p-4 border-4 border-black bg-error text-white font-bold text-sm flex gap-3 items-start neo-brutalism-shadow">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span>{errorText}</span>
              </div>
            )}

            {successText && (
              <div className="p-4 border-4 border-black bg-gumroad-yellow text-black font-bold text-sm flex gap-3 items-start neo-brutalism-shadow">
                <span>{successText}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full neo-stacked-hover btn-rounded flex justify-center py-4 px-4 border-4 border-black text-xl font-headline font-black uppercase text-black bg-gumroad-yellow transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create an account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center border-t-4 border-black pt-6">
            <button 
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setErrorText(''); setSuccessText(''); }}
              className="text-sm font-black font-label uppercase tracking-widest text-black hover:text-gumroad-pink transition-colors cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-4 border-black" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 border-4 border-black bg-white font-black font-label uppercase tracking-widest">Or continue with</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border-4 border-black bg-white text-lg font-headline font-black text-black hover:bg-gumroad-pink neo-brutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full flex justify-center items-center py-3 px-4 border-4 border-black bg-black text-white text-lg font-headline font-black hover:bg-gumroad-yellow hover:text-black neo-brutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
              >
                Guest Login (Dev Only)
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
