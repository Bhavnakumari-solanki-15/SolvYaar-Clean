import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getNFTContract } from '../lib/monad';

export function useNFTBalance(address: string | null) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!address) {
        setBalance(0);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { ethereum } = window;
        if (!ethereum) {
          throw new Error('MetaMask is not installed');
        }

        const provider = new ethers.BrowserProvider(ethereum);
        const contract = await getNFTContract(provider);
        const nftBalance = await contract.balanceOf(address);
        setBalance(Number(nftBalance));
      } catch (err) {
        console.error('Error fetching NFT balance:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch NFT balance');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [address]);

  return { balance, isLoading, error };
} 