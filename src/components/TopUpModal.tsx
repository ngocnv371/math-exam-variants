import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle2, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentCoins: number;
  onSuccess: (newBalance: number) => void;
}

const PACKAGES = [
  { id: 'small', coins: 50, price: 5, popular: false },
  { id: 'medium', coins: 150, price: 12, popular: true },
  { id: 'large', coins: 500, price: 35, popular: false },
];

export default function TopUpModal({ isOpen, onClose, userId, currentCoins, onSuccess }: TopUpModalProps) {
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    // Simulate payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const newBalance = currentCoins + selectedPackage.coins;
      
      // Update Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ coins: newBalance })
        .eq('id', userId);

      if (error) throw error;

      setSuccess(true);
      onSuccess(newBalance);
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setIsProcessing(false);
      }, 2000);

    } catch (error) {
      console.error('Payment failed:', error);
      alert('Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-[#1A1A1A]/10 dark:border-white/10 relative">
        <button 
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 text-[#1A1A1A]/50 dark:text-white/50 hover:bg-[#F5F5F0] dark:hover:bg-[#2A2A2A] rounded-full transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="w-12 h-12 bg-[#5A5A40]/10 dark:bg-[#8A8A60]/20 rounded-2xl flex items-center justify-center mb-6">
            <Coins className="text-[#5A5A40] dark:text-[#8A8A60]" size={24} />
          </div>
          
          <h2 className="text-2xl font-serif italic mb-2 dark:text-white">Top Up Coins</h2>
          <p className="text-sm text-[#1A1A1A]/60 dark:text-white/60 mb-8">
            Coins are used to generate exam variants. 1 variant = 1 coin.
          </p>

          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="text-green-600 dark:text-green-400" size={32} />
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">Payment Successful!</h3>
              <p className="text-[#1A1A1A]/60 dark:text-white/60">
                Added {selectedPackage.coins} coins to your balance.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-8">
                {PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 text-left transition-all relative flex items-center justify-between",
                      selectedPackage.id === pkg.id
                        ? "border-[#5A5A40] dark:border-[#8A8A60] bg-[#5A5A40]/5 dark:bg-[#8A8A60]/10"
                        : "border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#1A1A1A]/30 dark:hover:border-white/30"
                    )}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-4 bg-[#5A5A40] text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        selectedPackage.id === pkg.id ? "border-[#5A5A40] dark:border-[#8A8A60]" : "border-[#1A1A1A]/20 dark:border-white/20"
                      )}>
                        {selectedPackage.id === pkg.id && <div className="w-2.5 h-2.5 bg-[#5A5A40] dark:bg-[#8A8A60] rounded-full" />}
                      </div>
                      <span className="font-bold dark:text-white">{pkg.coins} Coins</span>
                    </div>
                    <span className="font-medium text-[#1A1A1A]/60 dark:text-white/60">${pkg.price}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full py-4 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black dark:hover:bg-gray-200 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Pay ${selectedPackage.price}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
