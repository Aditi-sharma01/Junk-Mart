import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins, Calculator, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '../lib/auth';

const TOKEN_PRICE = 10; // ₹10 per token
const SELL_FEE = 0.04;   // 4% fee

const TokenShop = () => {
  const [balance, setBalance] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [buyResult, setBuyResult] = useState<string>('');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [sellResult, setSellResult] = useState<string>('');
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellCalculation, setSellCalculation] = useState<any>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [isBuyingPack, setIsBuyingPack] = useState<number | null>(null);
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchBalance();
  }, [user?.id]); // Add user.id to dependency array

  useEffect(() => {
    if (!user) return;
    fetch(`/api/transaction-history?user_id=${user.id}`)
      .then(res => res.json())
      .then(setTransactions);
  }, [user]);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/token-balance?user_id=${user?.id}`);
      const data = await res.json();
      setBalance(data.token_balance);
      
      // Dispatch custom event to notify navigation component
      window.dispatchEvent(new CustomEvent('tokenBalanceUpdated'));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleBuy = async () => {
    if (isBuying) return; // Prevent multiple clicks
    
    setBuyResult('');
    const rupees = parseFloat(buyAmount);
    if (isNaN(rupees) || rupees <= 0) {
      setBuyResult('Enter a valid amount.');
      return;
    }
    if (!user) {
      setBuyResult('You must be logged in to buy tokens.');
      return;
    }
    
    setIsBuying(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/buy-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, rupees }),
      });
      const data = await res.json();
      if (data.tokens_added) {
        setBuyResult(`Bought ${data.tokens_added} tokens for ₹${data.cost}.`);
        setBuyAmount(''); // Clear input after successful purchase
        if (refreshUser) await refreshUser();
        await fetchBalance(); // Update balance immediately
        toast({ title: 'Success', description: 'Tokens added successfully!' });
      } else {
        setBuyResult('Failed to buy tokens.');
        toast({ title: 'Error', description: 'Failed to buy tokens.' });
      }
    } catch (error) {
      setBuyResult('Network error. Please try again.');
      toast({ title: 'Error', description: 'Network error. Please try again.' });
    } finally {
      setIsBuying(false);
    }
  };

  const handleSellClick = () => {
    const tokens = parseInt(sellAmount);
    if (isNaN(tokens) || tokens <= 0) {
      setSellResult('Enter a valid token amount.');
      return;
    }
    if (tokens > balance) {
      setSellResult('Not enough tokens to sell.');
      return;
    }

    // Calculate the detailed breakdown
    const tokenValue = tokens * TOKEN_PRICE;
    const feeAmount = tokenValue * SELL_FEE;
    const payout = tokenValue - feeAmount;

    setSellCalculation({
      tokens,
      tokenValue,
      feeAmount,
      payout,
      feePercentage: SELL_FEE * 100
    });
    setShowSellModal(true);
  };

  const handleSellConfirm = async () => {
    if (isSelling) return; // Prevent multiple clicks
    if (!agreeToTerms) {
      toast({ title: 'Error', description: 'Please agree to the terms and conditions.' });
      return;
    }

    setIsSelling(true);
    setSellResult('');
    const tokens = parseInt(sellAmount);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/sell-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, tokens }),
      });
      const data = await res.json();
      if (data.tokens_sold) {
        setSellResult(`Sold ${data.tokens_sold} tokens for ₹${data.payout.toFixed(2)} (after fee).`);
        setSellAmount(''); // Clear input after successful sale
        setAgreeToTerms(false);
        setShowSellModal(false);
        await fetchBalance(); // Update balance immediately
        toast({ title: 'Success', description: 'Tokens sold successfully!' });
      } else {
        setSellResult(data.error || 'Failed to sell tokens.');
        toast({ title: 'Error', description: data.error || 'Failed to sell tokens.' });
      }
    } catch (error) {
      setSellResult('Network error. Please try again.');
      toast({ title: 'Error', description: 'Network error. Please try again.' });
    } finally {
      setIsSelling(false);
    }
  };

  const tokenPacks = [
    { tokens: 10, price: 100 },
    { tokens: 25, price: 250 },
    { tokens: 50, price: 500 },
    { tokens: 100, price: 1000 },
  ];

  const handleBuyPack = async (pack: { tokens: number, price: number }) => {
    if (isBuyingPack === pack.tokens) return; // Prevent multiple clicks for same pack
    
    setBuyResult('');
    setIsBuyingPack(pack.tokens);
    
    if (!user) {
      setBuyResult('You must be logged in to buy tokens.');
      setIsBuyingPack(null);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/buy-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, rupees: pack.price }),
      });
      const data = await res.json();
      if (data.tokens_added) {
        setBuyResult(`Purchased ${data.tokens_added} tokens for ₹${data.cost}!`);
        if (refreshUser) await refreshUser();
        await fetchBalance(); // Update balance immediately
        toast({ title: 'Success', description: 'Tokens added successfully!' });
      } else {
        setBuyResult('Failed to purchase tokens.');
        toast({ title: 'Error', description: 'Failed to purchase tokens.' });
      }
    } catch (error) {
      setBuyResult('Network error. Please try again.');
      toast({ title: 'Error', description: 'Network error. Please try again.' });
    } finally {
      setIsBuyingPack(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-2">
            <Coins size={48} className="text-amber-400 drop-shadow" />
          </div>
          <h1 className="text-4xl font-extrabold text-eco-primary mb-2">Token Shop</h1>
          <p className="text-lg text-gray-600">Buy and sell tokens to use as currency in the marketplace.</p>
        </div>
        {/* Balance Card */}
        <Card className="mb-8 shadow-lg border-2 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="text-amber-400" />
              Your Token Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-500 flex items-center gap-2">
              {balance} <Coins size={28} className="text-amber-400" />
            </div>
          </CardContent>
        </Card>
        {/* Token Packs */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle>Buy Token Packs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 justify-center mb-4">
              {tokenPacks.map((pack) => (
                <div
                  key={pack.tokens}
                  className="border-2 border-amber-200 bg-white rounded-xl p-6 flex flex-col items-center shadow hover:shadow-xl transition-shadow duration-200 hover:scale-105 cursor-pointer min-w-[140px]"
                >
                  <div className="text-2xl font-bold mb-1 text-amber-600 flex items-center gap-1">
                    <Coins size={20} className="text-amber-400" /> {pack.tokens}
                  </div>
                  <div className="mb-2 text-lg font-semibold text-gray-700">₹{pack.price}</div>
                  <Button 
                    onClick={() => handleBuyPack(pack)} 
                    disabled={isBuyingPack === pack.tokens}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold disabled:opacity-50"
                  >
                    {isBuyingPack === pack.tokens ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buying...
                      </>
                    ) : (
                      'Buy'
                    )}
                  </Button>
                </div>
              ))}
            </div>
            {buyResult && <div className="mt-2 text-green-600 font-semibold text-center">{buyResult}</div>}
          </CardContent>
        </Card>
        {/* Buy Custom Amount */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle>Buy Custom Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-gray-600">1 token = <span className="font-bold">₹10</span></div>
            <div className="flex gap-2 items-center mb-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount in rupees"
                value={buyAmount}
                onChange={e => setBuyAmount(e.target.value)}
                className="w-40"
                disabled={isBuying}
              />
              <Button 
                onClick={handleBuy} 
                disabled={isBuying}
                className="bg-amber-400 hover:bg-amber-500 text-white font-bold disabled:opacity-50"
              >
                {isBuying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buying...
                  </>
                ) : (
                  'Buy'
                )}
              </Button>
            </div>
            {buyResult && <div className="mt-2 text-green-600 font-semibold text-center">{buyResult}</div>}
          </CardContent>
        </Card>
        {/* Transaction History Section */}
        {user && (
          <Card className="mb-8 shadow-md">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-green-700">Incoming (Sales)</h3>
                  <ul className="divide-y divide-gray-200">
                    {transactions.filter(tx => tx.seller_id === user.id).length === 0 && <li className="text-gray-400">No incoming transactions.</li>}
                    {transactions.filter(tx => tx.seller_id === user.id).map(tx => (
                      <li key={tx.id} className="py-2">
                        <span className="font-bold">+{tx.tokens.toFixed(2)} tokens</span> for {tx.amount_kg.toFixed(2)} kg {tx.category} <span className="text-xs text-gray-400">({new Date(tx.timestamp).toLocaleString()})</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-amber-700">Outgoing (Purchases)</h3>
                  <ul className="divide-y divide-gray-200">
                    {transactions.filter(tx => tx.buyer_id === user.id).length === 0 && <li className="text-gray-400">No outgoing transactions.</li>}
                    {transactions.filter(tx => tx.buyer_id === user.id).map(tx => (
                      <li key={tx.id} className="py-2">
                        <span className="font-bold">-{tx.tokens.toFixed(2)} tokens</span> for {tx.amount_kg.toFixed(2)} kg {tx.category} <span className="text-xs text-gray-400">({new Date(tx.timestamp).toLocaleString()})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Sell Tokens */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Sell Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-gray-600">Sell fee: <span className="font-bold">4%</span> (You get <span className="font-bold">₹9.60</span> per token)</div>
            <div className="flex gap-2 items-center mb-2">
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="Tokens to sell"
                value={sellAmount}
                onChange={e => setSellAmount(e.target.value)}
                className="w-40"
                disabled={isSelling}
              />
              <Button 
                onClick={handleSellClick} 
                disabled={isSelling}
                className="bg-amber-400 hover:bg-amber-500 text-white font-bold disabled:opacity-50"
              >
                Sell
              </Button>
            </div>
            {sellResult && <div className="mt-2 text-green-600 font-semibold text-center">{sellResult}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Sell Confirmation Modal */}
      {showSellModal && sellCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="text-amber-400" size={24} />
              <h2 className="text-xl font-bold">Sell Token Calculation</h2>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Tokens to sell:</span>
                <span className="font-semibold">{sellCalculation.tokens} tokens</span>
              </div>
              <div className="flex justify-between">
                <span>Token value:</span>
                <span className="font-semibold">₹{sellCalculation.tokenValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Sell fee ({sellCalculation.feePercentage}%):</span>
                <span className="font-semibold">-₹{sellCalculation.feeAmount.toFixed(2)}</span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>You will receive:</span>
                <span>₹{sellCalculation.payout.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-amber-600 mt-0.5" size={16} />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Terms & Conditions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>You agree to pay applicable taxes on the sale</li>
                    <li>Transaction fees are non-refundable</li>
                    <li>Sale is final once confirmed</li>
                    <li>You must have sufficient tokens in your account</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                disabled={isSelling}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the terms and conditions and understand the tax implications
              </Label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowSellModal(false);
                  setAgreeToTerms(false);
                }}
                variant="outline"
                className="flex-1"
                disabled={isSelling}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSellConfirm}
                disabled={!agreeToTerms || isSelling}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-white disabled:opacity-50"
              >
                {isSelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Sale'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TokenShop; 