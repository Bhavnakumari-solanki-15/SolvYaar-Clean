import { ethers } from 'ethers';
import { saveMathScroll } from './supabase';
import { toast } from 'react-toastify';

interface MintScrollParams {
  problem: string;
  solution: string;
  walletAddress: string;
  signer: ethers.JsonRpcSigner;
}

export async function mintScroll({ problem, solution, walletAddress, signer }: MintScrollParams) {
  // Show minting in progress toast
  const mintingToast = toast.loading('Minting your scroll...');

  try {
    // Get a random math-themed image from Unsplash
    const imageUrl = `https://source.unsplash.com/random/400x300/?math,ancient,scroll&${Date.now()}`;

    // Create metadata for the NFT
    const metadata = {
      name: 'Math Scroll',
      description: problem,
      image: imageUrl,
      attributes: {
        solution,
        timestamp: new Date().toISOString()
      }
    };

    // Get the contract instance
    const contract = await getNFTContract(signer);

    // Mint the NFT
    console.log('Minting NFT...');
    const tx = await contract.mint(walletAddress, JSON.stringify(metadata));
    
    // Show waiting for confirmation toast
    toast.update(mintingToast, {
      render: 'Waiting for transaction confirmation...',
      type: 'info',
      isLoading: true
    });

    // Wait for transaction confirmation
    console.log('Waiting for transaction confirmation...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    // Save to Supabase
    const scroll = await saveMathScroll({
      problem,
      solution,
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

    return scroll;
  } catch (error: any) {
    console.error('Error minting scroll:', error);

    // Handle user rejection
    if (error.code === 4001) {
      toast.update(mintingToast, {
        render: 'Minting canceled by user',
        type: 'info',
        isLoading: false,
        autoClose: 5000
      });
      return null;
    }

    // Handle other errors
    toast.update(mintingToast, {
      render: `Error minting scroll: ${error.message || 'Unknown error'}`,
      type: 'error',
      isLoading: false,
      autoClose: 5000
    });
    throw error;
  }
} 