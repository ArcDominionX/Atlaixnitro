import { MoralisService, WalletBalance } from './MoralisService';
import { DatabaseService } from './DatabaseService';

export type ChainType = 'Solana' | 'Ethereum' | 'BSC' | 'Polygon' | 'Avalanche' | 'Base' | 'Arbitrum' | 'Optimism' | 'All Chains';

export interface PortfolioData {
    netWorth: string;
    assets: {
        symbol: string;
        address: string;
        balance: string;
        value: string;
        price: string;
        logo: string;
        rawValue: number;
    }[];
    recentActivity: {
        type: string;
        desc: string;
        time: string;
        hash: string;
    }[];
    providerUsed: 'Moralis' | 'Cache';
    chainIcon: string;
    timestamp: number;
}

// --- PERFORMANCE ENGINE ---

class SmartCache {
    private cache = new Map<string, { data: any; expiry: number }>();
    private pendingRequests = new Map<string, Promise<any>>();
    private TTL = 60 * 1000; 

    async getOrFetch(key: string, fetcher: () => Promise<any>): Promise<any> {
        const now = Date.now();
        if (this.cache.has(key)) {
            const entry = this.cache.get(key)!;
            if (entry.expiry > now) {
                return { ...entry.data, providerUsed: 'Cache' };
            }
        }

        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }

        const promise = fetcher().then((data) => {
            this.cache.set(key, { data, expiry: Date.now() + this.TTL });
            this.pendingRequests.delete(key);
            return data;
        }).catch(err => {
            this.pendingRequests.delete(key);
            throw err;
        });

        this.pendingRequests.set(key, promise);
        return promise;
    }
}

const cacheManager = new SmartCache();

// --- MORALIS PROVIDER INTEGRATION ---

/**
 * Universal fetcher that routes all requests to the Moralis Data API.
 */
const fetchFromMoralis = async (chain: string, address: string): Promise<PortfolioData> => {
    
    // 1. Fetch Real Balances
    const balances: WalletBalance[] = await MoralisService.getWalletBalances(address, chain);
    
    // 2. Identify tokens missing prices (Moralis sometimes doesn't have pricing for new pairs)
    const missingPriceAddresses = balances
        .filter(b => (!b.price_usd || b.price_usd === 0) && (!b.usd_value || b.usd_value === 0))
        .map(b => b.token_address);
        
    // 3. Fetch missing prices from DexScreener Fallback
    let dexPrices: Record<string, number> = {};
    if (missingPriceAddresses.length > 0) {
        dexPrices = await DatabaseService.getBulkPrices(missingPriceAddresses);
    }
    
    // 4. Activity (Still waiting for endpoint logic or mock removal)
    
    let totalUsd = 0;
    const assets = balances.map(b => {
        const decimals = b.decimals || 18;
        const bal = parseFloat(b.balance) / Math.pow(10, decimals);
        
        // Price Logic: Moralis Price -> DexScreener Price -> Derived -> 0
        let price = b.price_usd || 0;
        
        if (price === 0 && dexPrices[b.token_address.toLowerCase()]) {
            price = dexPrices[b.token_address.toLowerCase()];
        }
        
        // If Moralis gave usd_value but no unit price (rare but possible), calc unit price
        if (price === 0 && b.usd_value && b.usd_value > 0) {
             price = b.usd_value / bal;
        }
        
        // Final Value Calc
        const value = (price > 0) ? (bal * price) : (b.usd_value || 0);
        
        totalUsd += value;

        return {
            symbol: b.symbol,
            address: b.token_address,
            balance: `${bal.toLocaleString(undefined, {maximumFractionDigits: 4})} ${b.symbol}`,
            value: `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            price: `$${price.toLocaleString(undefined, {maximumFractionDigits: 6})}`,
            logo: b.logo || `https://ui-avatars.com/api/?name=${b.symbol}&background=random`,
            rawValue: value
        };
    }).sort((a, b) => b.rawValue - a.rawValue);

    // Determine Chain Icon
    let chainIcon = 'https://cryptologos.cc/logos/ethereum-eth-logo.png';
    if (chain.toLowerCase() === 'solana') chainIcon = 'https://cryptologos.cc/logos/solana-sol-logo.png';
    if (chain.toLowerCase() === 'bsc') chainIcon = 'https://cryptologos.cc/logos/bnb-bnb-logo.png';

    // No fake recent activity. If we don't have the endpoint connected, return empty.
    const recentActivity: any[] = [];

    return {
        netWorth: `$${totalUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        providerUsed: 'Moralis',
        timestamp: Date.now(),
        chainIcon: chainIcon,
        assets: assets,
        recentActivity: recentActivity
    };
};

export const ChainRouter = {
    fetchPortfolio: async (chain: string, address: string): Promise<PortfolioData> => {
        // Normalize key for caching
        const normalizedChain = chain.toLowerCase();
        const requestKey = `moralis_${normalizedChain}_${address}`;

        return cacheManager.getOrFetch(requestKey, async () => {
            return fetchFromMoralis(chain, address);
        });
    }
};