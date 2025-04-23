import { ethers } from 'ethers';

// Define window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum: any;
  }
}

// ABI for ERC721 NFT Contract
const NFT_ABI = [
  // Basic ERC721 functions
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function mint(address to, string memory tokenURI) returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

// Replace this with your Math Scroll contract address after deployment
const CONTRACT_ADDRESS = "0x104451A5f6B8d94C37A250613d7e8cE4543bAe0C";

// Monad Testnet Configuration
export const MONAD_TESTNET_CONFIG = {
  chainId: '0x279f', // Hexadecimal format with 0x prefix (10143 in decimal)
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com']
};

// Remove the old helper functions and updated config since we're using the correct values directly
export const MONAD_TESTNET_CONFIG_UPDATED = MONAD_TESTNET_CONFIG;

type WalletConnection = {
  address: string;
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
}

// Connect to Monad network via MetaMask
export async function connectWallet(): Promise<WalletConnection> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Add Monad network if not already added
    await addMonadToMetaMask();
    
    // Switch to Monad network
    await switchToMonadNetwork();
    
    // Get the provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    return { 
      address: accounts[0],
      provider,
      signer
    };
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    throw error;
  }
}

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Add Monad Testnet to MetaMask
 */
export async function addMonadToMetaMask(): Promise<boolean> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    console.log('Adding Monad network with config:', MONAD_TESTNET_CONFIG);
    
    // Create a clean network config object
    const networkConfig = {
      chainId: MONAD_TESTNET_CONFIG.chainId,
      chainName: MONAD_TESTNET_CONFIG.chainName,
      nativeCurrency: MONAD_TESTNET_CONFIG.nativeCurrency,
      rpcUrls: MONAD_TESTNET_CONFIG.rpcUrls,
      blockExplorerUrls: MONAD_TESTNET_CONFIG.blockExplorerUrls
    };

    // Try to add the network
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkConfig],
    });
    
    console.log('Successfully added Monad network');
    return true;
  } catch (error: any) {
    console.error('Error adding Monad network:', error);
    
    if (error.code === 4001) {
      throw new Error('User rejected the request to add the Monad network');
    } else if (error.code === -32603) {
      // If there's an issue with the chain ID format, try with a different format
      if (error.message && error.message.includes('chain ID')) {
        console.log('Chain ID format issue detected, trying with decimal format');
        
        // Try with decimal format
        const decimalNetworkConfig = {
          chainId: '10143', // Decimal format
          chainName: MONAD_TESTNET_CONFIG.chainName,
          nativeCurrency: MONAD_TESTNET_CONFIG.nativeCurrency,
          rpcUrls: MONAD_TESTNET_CONFIG.rpcUrls,
          blockExplorerUrls: MONAD_TESTNET_CONFIG.blockExplorerUrls
        };
        
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [decimalNetworkConfig],
          });
          
          console.log('Successfully added Monad network with decimal chain ID');
          return true;
        } catch (decimalError: any) {
          console.error('Error adding Monad network with decimal chain ID:', decimalError);
          
          // Try with lowercase hex format
          console.log('Trying with lowercase hex format');
          const lowercaseHexNetworkConfig = {
            chainId: '0x279f', // Lowercase hex format
            chainName: MONAD_TESTNET_CONFIG.chainName,
            nativeCurrency: MONAD_TESTNET_CONFIG.nativeCurrency,
            rpcUrls: MONAD_TESTNET_CONFIG.rpcUrls,
            blockExplorerUrls: MONAD_TESTNET_CONFIG.blockExplorerUrls
          };
          
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [lowercaseHexNetworkConfig],
            });
            
            console.log('Successfully added Monad network with lowercase hex chain ID');
            return true;
          } catch (lowercaseError: any) {
            console.error('Error adding Monad network with lowercase hex chain ID:', lowercaseError);
            throw new Error('Failed to add the Monad network with multiple chain ID formats.');
          }
        }
      } else {
        throw new Error('Failed to add the Monad network. The chain ID returned by the RPC endpoint does not match the submitted chain ID.');
      }
    }
    throw error;
  }
}

/**
 * Switch to Monad Testnet
 */
export async function switchToMonadNetwork(): Promise<boolean> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    console.log('Attempting to switch to Monad network with chainId:', MONAD_TESTNET_CONFIG.chainId);
    
    // First try to switch to the network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET_CONFIG.chainId }],
      });
      console.log('Successfully switched to Monad network');
      return true;
    } catch (switchError: any) {
      console.log('Error switching to Monad network:', switchError);
      
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        console.log('Network not found, attempting to add it first');
        await addMonadToMetaMask();
        
        // Try switching again after adding
        console.log('Network added, attempting to switch again');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: MONAD_TESTNET_CONFIG.chainId }],
          });
          console.log('Successfully switched to Monad network after adding');
          return true;
        } catch (retryError: any) {
          console.log('Error switching to Monad network after adding:', retryError);
          
          // Try with decimal format
          if (retryError.code === -32603 && retryError.message && retryError.message.includes('chain ID')) {
            console.log('Trying to switch with decimal chain ID format');
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '10143' }], // Decimal format
              });
              console.log('Successfully switched to Monad network with decimal chain ID');
              return true;
            } catch (decimalError: any) {
              console.error('Error switching with decimal chain ID:', decimalError);
              throw new Error('Failed to switch to Monad network with multiple chain ID formats.');
            }
          }
          throw retryError;
        }
      }
      throw switchError;
    }
  } catch (error: any) {
    console.error('Error in switchToMonadNetwork:', error);
    
    if (error.code === 4001) {
      throw new Error('User rejected the request to switch to Monad network');
    } else {
      throw new Error(`Failed to switch to Monad network: ${error.message || 'Unknown error'}`);
    }
  }
}

// Get NFT contract instance
export async function getNFTContract(provider: ethers.BrowserProvider | ethers.JsonRpcSigner): Promise<ethers.Contract> {
  return new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, provider);
}

/**
 * Get a Monad provider
 * @returns An ethers provider connected to Monad testnet
 */
export async function getMonadProvider(): Promise<ethers.BrowserProvider> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  
  // First ensure we're on the right network
  await switchToMonadNetwork();
  
  // Return a provider connected to the Monad testnet
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getMonadSigner() {
  const provider = await getMonadProvider();
  return await provider.getSigner();
}

type MintResult = {
  tokenId: string;
  txHash: string;
}

// Mint a new NFT
export async function mintNFT(signer: ethers.JsonRpcSigner, tokenURI: string): Promise<MintResult> {
  try {
    const contract = await getNFTContract(signer);
    const tx = await contract.mint(await signer.getAddress(), tokenURI);
    const receipt = await tx.wait();
    
    // Find the token ID from the event logs
    const event = receipt.logs.find((log: any) => {
      const parsedLog = contract.interface.parseLog(log);
      return parsedLog && parsedLog.name === 'Transfer';
    });
    
    if (!event) {
      throw new Error("Transfer event not found in transaction receipt");
    }
    
    const parsedLog = contract.interface.parseLog(event);
    if (!parsedLog) {
      throw new Error("Failed to parse Transfer event log");
    }
    
    const tokenId = parsedLog.args[2].toString(); // tokenId is typically the third arg in Transfer events
    
    return {
      tokenId,
      txHash: receipt.hash
    };
  } catch (error) {
    console.error("Failed to mint NFT:", error);
    throw error;
  }
}

type NFTMetadata = {
  id: string;
  tokenURI: string;
  metadata: any;
}

// Get all NFTs owned by an address
export async function getUserNFTs(provider: ethers.BrowserProvider, address: string): Promise<NFTMetadata[]> {
  try {
    const contract = await getNFTContract(provider);
    const balance = await contract.balanceOf(address);
    
    const tokenIds: string[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      tokenIds.push(tokenId.toString());
    }
    
    const nfts = await Promise.all(tokenIds.map(async (id) => {
      const tokenURI = await contract.tokenURI(id);
      // Fetch metadata from URI (assuming it's a JSON URL)
      let metadata = {};
      try {
        const response = await fetch(tokenURI);
        metadata = await response.json();
      } catch (error) {
        console.error(`Failed to fetch metadata for token ${id}:`, error);
      }
      
      return {
        id,
        tokenURI,
        metadata
      };
    }));
    
    return nfts;
  } catch (error) {
    console.error("Failed to get user NFTs:", error);
    throw error;
  }
}

/**
 * Get all badges (NFTs) owned by the current user
 * @returns Array of badge metadata
 */
export async function getUserBadges(): Promise<NFTMetadata[]> {
  try {
    // Get the current user's address
    const provider = await getMonadProvider();
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Get all NFTs owned by the user
    return await getUserNFTs(provider, address);
  } catch (error) {
    console.error("Failed to get user badges:", error);
    return []; // Return empty array on error
  }
}

/**
 * Get the practice history for the current user
 * @returns Array of practice history items
 */
export async function getUserPracticeHistory(): Promise<any[]> {
  try {
    // Get the current user's address
    const provider = await getMonadProvider();
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // In a real implementation, this would query a database or smart contract
    // For now, we'll return a mock history
    return [
      {
        id: "1",
        topic: "Algebra",
        score: 85,
        date: new Date().toISOString(),
        timeSpent: 1200, // in seconds
        questionsAnswered: 10
      },
      {
        id: "2",
        topic: "Geometry",
        score: 92,
        date: new Date(Date.now() - 86400000).toISOString(), // yesterday
        timeSpent: 900,
        questionsAnswered: 8
      }
    ];
  } catch (error) {
    console.error("Failed to get user practice history:", error);
    return []; // Return empty array on error
  }
}

/**
 * Fully disconnect wallet by clearing any cached sessions
 * To be used when disconnecting wallet or signing out
 */
export async function disconnectWallet(): Promise<void> {
  try {
    // Set a flag in localStorage to prevent auto-reconnection
    localStorage.setItem('wallet_disconnected', 'true');
    
    // Clear any ethers.js or wallet-related localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Check for ethers-related local storage keys
      if (key && (
        key.startsWith('ethers') || 
        key.startsWith('metamask') || 
        key.startsWith('walletconnect') ||
        key.startsWith('wallet') ||
        key.includes('account') ||
        key.includes('connect')
      )) {
        localStorage.removeItem(key);
      }
    }
    
    // Try to use disconnect method if available
    if (window.ethereum && typeof window.ethereum.disconnect === 'function') {
      try {
        await window.ethereum.disconnect();
      } catch (disconnectErr) {
        console.log('Provider does not support disconnect method', disconnectErr);
      }
    }
    
    console.log('Wallet successfully disconnected');
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw error;
  }
} 