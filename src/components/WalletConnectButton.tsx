import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { switchToMonadNetwork, MONAD_TESTNET_CONFIG_UPDATED, disconnectWallet } from '@/lib/monad';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

interface WalletConnectButtonProps {
  onConnect: (address: string) => void;
  className?: string;
}

export function WalletConnectButton({ onConnect, className = '' }: WalletConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  // Check if already connected
  useEffect(() => {
    // Only check connection if not previously disconnected
    if (!localStorage.getItem('wallet_disconnected')) {
      checkConnection();
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        // Compare the chain IDs directly since they're both in hex format
        if (chainId === MONAD_TESTNET_CONFIG_UPDATED.chainId) {
          handleAccountsChanged(accounts);
        }
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setConnectedAddress(null);
    } else {
      const address = accounts[0];
      setConnectedAddress(address);
      // Remove disconnected flag when account is connected
      localStorage.removeItem('wallet_disconnected');
      onConnect(address);
    }
  };

  const handleChainChanged = async (chainId: string) => {
    // Compare the chain IDs directly since they're both in hex format
    if (chainId !== MONAD_TESTNET_CONFIG_UPDATED.chainId) {
      setConnectedAddress(null);
      try {
        await switchToMonadNetwork();
      } catch (err) {
        console.error('Error switching network:', err);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to connect your wallet');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Remove disconnected flag when user attempts to connect
      localStorage.removeItem('wallet_disconnected');
      
      // First ensure we're on the Monad network
      try {
        await switchToMonadNetwork();
      } catch (networkError: any) {
        // If the user rejected adding the network, show a more helpful message
        if (networkError.message.includes('User rejected')) {
          setError('You need to approve adding the Monad network in MetaMask to continue. Please try again and click "Approve" when prompted.');
          setIsConnecting(false);
          return;
        }
        throw networkError; // Re-throw other network errors
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      handleAccountsChanged(accounts);
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      
      // Provide more specific error messages
      if (err.message.includes('User rejected')) {
        setError('You rejected the connection request. Please try again and approve the request in MetaMask.');
      } else if (err.message.includes('already processing eth_requestAccounts')) {
        setError('MetaMask is already processing a connection request. Please check your MetaMask extension.');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Call the centralized disconnect wallet function
      await disconnectWallet();
      
      // Clear the wallet address from our state
      setConnectedAddress(null);
      
      // Show success message
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been fully disconnected from the app.",
        duration: 3000,
      });
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!window.ethereum) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className={className}>
            Install MetaMask
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MetaMask Not Installed</DialogTitle>
            <DialogDescription>
              To use the Math Oracle feature, you need to install MetaMask, a cryptocurrency wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>
              MetaMask is a browser extension that allows you to interact with blockchain applications.
              It's required for connecting to the Monad testnet and minting Math Oracle NFTs.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                  Install MetaMask <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={className}>
      {!connectedAddress ? (
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          variant="default"
        >
          {isConnecting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <>🦊 Connect Wallet</>
          )}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="text-sm font-mono">
              {formatAddress(connectedAddress)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDisconnect}>
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 