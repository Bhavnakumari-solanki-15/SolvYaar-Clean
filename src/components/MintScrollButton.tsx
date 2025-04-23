import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { mintNFT, getNFTContract } from '@/lib/monad';
import { saveMathScroll, MathScroll } from '@/lib/supabase';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

interface MintScrollButtonProps {
  walletAddress: string;
  fortune: string;
  imageUrl: string;
  onSuccess: (scroll: MathScroll) => void;
  disabled?: boolean;
}

export function MintScrollButton({
  walletAddress,
  fortune,
  imageUrl,
  onSuccess,
  disabled = false
}: MintScrollButtonProps) {
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async () => {
    if (!walletAddress || !fortune || !imageUrl || isMinting) {
      return;
    }

    setIsMinting(true);
    const mintingToast = toast.loading('Preparing to mint your scroll...');

    try {
      // Initialize wallet connection and get signer
      const { ethereum } = window;
      if (!ethereum) throw new Error("MetaMask is not installed");
      
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      // Create metadata for the NFT
      const metadata = {
        name: "Math Oracle Scroll",
        description: fortune,
        image: imageUrl,
        attributes: [
          {
            trait_type: "Type",
            value: "Math Oracle"
          },
          {
            trait_type: "Creation Date",
            value: new Date().toISOString()
          }
        ]
      };

      // Update toast
      toast.update(mintingToast, {
        render: 'Minting your scroll...',
        type: 'info',
        isLoading: true
      });
      
      // Get contract and mint the NFT
      const contract = await getNFTContract(signer);
      const tx = await contract.mint(walletAddress, JSON.stringify(metadata));
      
      // Update toast
      toast.update(mintingToast, {
        render: 'Waiting for transaction confirmation...',
        type: 'info',
        isLoading: true
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Save to Supabase
      const scroll = await saveMathScroll({
        problem: fortune,
        solution: fortune, // For now, using fortune as both problem and solution
        image_url: imageUrl,
        wallet_address: walletAddress,
        timestamp: new Date().toISOString(),
        tx_hash: receipt.hash
      });

      if (!scroll) {
        throw new Error('Failed to save scroll to database');
      }

      // Show success toast
      toast.update(mintingToast, {
        render: 'Scroll minted successfully! 🎉',
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
      
      // Notify parent component of successful mint
      onSuccess(scroll);
      
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      
      // Handle user rejection
      if (error.code === 4001) {
        toast.update(mintingToast, {
          render: 'Minting canceled by user',
          type: 'info',
          isLoading: false,
          autoClose: 5000
        });
        return;
      }

      // Handle other errors
      toast.update(mintingToast, {
        render: `Error minting scroll: ${error.message || 'Unknown error'}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleMint}
        disabled={!walletAddress || !fortune || !imageUrl || isMinting || disabled}
        variant="secondary"
        size="lg"
        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-medium"
      >
        {isMinting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Minting Scroll...
          </span>
        ) : (
          <>🎁 Mint This Scroll</>
        )}
      </Button>
    </div>
  );
} 