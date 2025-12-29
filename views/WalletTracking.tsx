
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Zap, ArrowLeft, RefreshCw, ArrowUpRight, ArrowDownLeft, Repeat, CheckCircle, AlertTriangle, Globe, Wallet as WalletIcon } from 'lucide-react';
import { ChainRouter, PortfolioData } from '../services/ChainRouter';
import { MarketCoin } from '../types';

declare var ApexCharts: any;

interface WalletData {
    id: number;
    addr: string;
    tag: string;
    bal: string;
    pnl: string;
    win: string;
    tokens: number;
    time: string;
    type: string;
}

interface WalletTrackingProps {
    onTokenSelect?: (token: MarketCoin | string) => void;
}

export const WalletTracking: React.FC<WalletTrackingProps> = ({ onTokenSelect }) => {
    const [viewMode, setViewMode] = useState<'dashboard' | 'profile'>('dashboard');
    const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [walletType, setWalletType] = useState('Smart Money');
    const [chain, setChain] = useState('All Chains');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [visibleCount, setVisibleCount] = useState(8);
    const [showDust, setShowDust] = useState(false);
    
    const netWorthChartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<any>(null);
    const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const toggleFilter = (name: string) => setActiveFilter(activeFilter === name ? null : name);
    
    const openWallet = (w: WalletData) => { 
        setSelectedWallet(w); 
        setViewMode('profile'); 
        setShowDust(false); 
    };

    const handleTrack = () => {
        if (!searchQuery.trim()) return;
        const searchedWallet: WalletData = {
            id: Date.now(),
            addr: searchQuery,
            tag: 'Unknown',
            bal: 'Loading...',
            pnl: 'N/A',
            win: 'N/A',
            tokens: 0,
            time: 'Just now',
            type: 'smart'
        };
        openWallet(searchedWallet);
        setSearchQuery('');
    };

    const getDropdownStyle = (key: string) => {
        const button = buttonRefs.current[key];
        if (!button) return {};
        const rect = button.getBoundingClientRect();
        return {
            position: 'fixed' as const,
            top: `${rect.bottom + 8}px`,
            left: `${rect.left}px`,
            zIndex: 9999,
            minWidth: `${rect.width}px`
        };
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeFilter) {
                const target = event.target as Element;
                if (!target.closest('.filter-wrapper') && !target.closest('.filter-popup')) {
                    setActiveFilter(null);
                }
            }
        };
        const handleScroll = () => { if (activeFilter) setActiveFilter(null); };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeFilter]);

    useEffect(() => {
        const fetchData = async () => {
            if (viewMode === 'profile' && selectedWallet) {
                setLoading(true);
                try {
                    const targetChain = chain === 'All Chains' ? 'Ethereum' : chain;
                    const data = await ChainRouter.fetchPortfolio(targetChain, selectedWallet.addr);
                    setPortfolioData(data);
                } catch (e) {
                    console.error("Failed to fetch wallet data", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [viewMode, selectedWallet, chain]); 

    useEffect(() => {
        if (viewMode === 'profile' && netWorthChartRef.current && typeof ApexCharts !== 'undefined' && !loading) {
            // Cleanup previous instance
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }

            // CRITICAL: Clear the container div to prevent duplicate charts if destroy() lags or race condition occurs
            if (netWorthChartRef.current) {
                netWorthChartRef.current.innerHTML = '';
            }

            const options = {
                series: [{ name: 'Net Worth', data: [0, 0, 0, 0, 0, 0, 0, 0] }],
                chart: { type: 'area', height: 280, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
                colors: ['#26D356'],
                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
                stroke: { curve: 'smooth', width: 2 },
                dataLabels: { enabled: false },
                xaxis: { categories: [], labels: { style: { colors: '#8F96A3', fontFamily: 'Inter', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                yaxis: { labels: { style: { colors: '#8F96A3', fontFamily: 'Inter', fontSize: '11px' }, formatter: (val: number) => `$${val}` } },
                grid: { borderColor: '#2A2E33', strokeDashArray: 4 },
                theme: { mode: 'dark' },
                tooltip: { theme: 'dark' },
                noData: { text: 'History N/A', style: { color: '#8F96A3' } }
            };

            const chart = new ApexCharts(netWorthChartRef.current, options);
            chart.render();
            chartInstance.current = chart;
        }
        return () => { 
            if (chartInstance.current) { 
                chartInstance.current.destroy(); 
                chartInstance.current = null; 
            } 
        };
    }, [viewMode, loading]);

    const wallets: WalletData[] = [
        { id: 1, addr: '0x7180...e68', tag: 'Whale', bal: '$4.53M', pnl: '+25.1%', win: '59%', tokens: 12, time: '1m ago', type: 'whale' },
        { id: 2, addr: '0x02f7...94e6', tag: 'Smart Money', bal: '$4.46M', pnl: '+8.8%', win: '59%', tokens: 23, time: '5m ago', type: 'smart' },
        { id: 3, addr: '0x33b1...e8fh', tag: 'Smart Money', bal: '$2.85M', pnl: '+57%', win: '55%', tokens: 5, time: '10m ago', type: 'smart' },
        { id: 4, addr: '0x2381...294b', tag: 'Sniper', bal: '$1.83M', pnl: '+0.1%', win: '61%', tokens: 291, time: '10h ago', type: 'sniper' },
        { id: 5, addr: '0x8Sc1...mvz', tag: 'Early Buyer', bal: '$3.52M', pnl: '+120%', win: '70%', tokens: 4, time: '1h ago', type: 'smart' },
        { id: 6, addr: '0x54Cha...205fc', tag: 'Sniper', bal: '$13.6M', pnl: '-2.4%', win: '45%', tokens: 150, time: '3d ago', type: 'sniper' },
    ];

    return (
        <div className="flex flex-col gap-6 pb-10">
            {viewMode === 'dashboard' ? (
                <>
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-text-light">Wallet Tracking</h2>
                                <p className="text-text-medium text-sm mt-1">Monitor whale activity and smart money movements.</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="flex-1 md:w-80 bg-[#111315] border border-border rounded-lg flex items-center px-3 py-2.5 focus-within:border-primary-green/50">
                                    <Search className="text-text-medium mr-2" size={18} />
                                    <input 
                                        type="text" 
                                        className="bg-transparent border-none text-text-light outline-none w-full text-sm placeholder-text-dark" 
                                        placeholder="Search wallet address..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                                    />
                                </div>
                                <button 
                                    className="bg-primary-green text-main font-bold px-4 py-2 rounded-lg hover:bg-primary-green-darker transition-colors whitespace-nowrap text-sm"
                                    onClick={handleTrack}
                                >
                                    Track
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1">
                            <div className="filter-wrapper relative flex-shrink-0">
                                <button 
                                    ref={el => (buttonRefs.current['chain'] = el)}
                                    className={`filter-pill ${activeFilter === 'chain' ? 'active' : ''}`}
                                    onClick={() => toggleFilter('chain')}
                                >
                                    <Globe size={16} /> {chain} <ChevronDown size={14} />
                                </button>
                                {activeFilter === 'chain' && (
                                    <div className="filter-popup" style={getDropdownStyle('chain')}>
                                        {['All Chains', 'Ethereum', 'Solana', 'BSC', 'Base'].map(c => (
                                            <div key={c} className="filter-list-item" onClick={() => { setChain(c); setActiveFilter(null); }}>{c}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="filter-wrapper relative flex-shrink-0">
                                <button 
                                    ref={el => (buttonRefs.current['type'] = el)}
                                    className={`filter-pill ${activeFilter === 'type' ? 'active' : ''}`}
                                    onClick={() => toggleFilter('type')}
                                >
                                    <Zap size={16} /> {walletType} <ChevronDown size={14} />
                                </button>
                                {activeFilter === 'type' && (
                                    <div className="filter-popup" style={getDropdownStyle('type')}>
                                        {['All Types', 'Smart Money', 'Whale', 'Sniper', 'Fresh Wallet'].map(t => (
                                            <div key={t} className="filter-list-item" onClick={() => { setWalletType(t); setActiveFilter(null); }}>{t}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wallets.map(w => (
                            <div 
                                key={w.id} 
                                className="bg-card border border-border rounded-xl p-5 hover:border-text-medium transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                onClick={() => openWallet(w)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${w.type === 'smart' ? 'bg-primary-green/10 border-primary-green/30 text-primary-green' : w.type === 'whale' ? 'bg-primary-blue/10 border-primary-blue/30 text-primary-blue' : 'bg-primary-red/10 border-primary-red/30 text-primary-red'}`}>
                                            {w.type === 'smart' ? <Zap size={18} /> : w.type === 'whale' ? <WalletIcon size={18} /> : <AlertTriangle size={18} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-text-light">{w.tag}</div>
                                            <div className="text-[10px] text-text-dark font-mono">{w.addr}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded border ${w.pnl.includes('+') ? 'bg-primary-green/10 text-primary-green border-primary-green/20' : 'bg-primary-red/10 text-primary-red border-primary-red/20'}`}>
                                        {w.pnl} PnL
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div className="text-[10px] text-text-dark font-bold uppercase">Balance</div>
                                        <div className="text-base font-bold text-text-light">{w.bal}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-text-dark font-bold uppercase">Win Rate</div>
                                        <div className="text-base font-bold text-text-light">{w.win}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-text-medium border-t border-border/50 pt-3">
                                    <span>Active {w.time}</span>
                                    <span className="group-hover:text-text-light transition-colors">View Portfolio &rarr;</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <button 
                        onClick={() => setViewMode('dashboard')} 
                        className="flex items-center gap-2 text-text-medium hover:text-text-light w-fit transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={16} /> Back to Wallets
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
                        <div className="flex flex-col gap-6">
                            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-primary-green/10 flex items-center justify-center text-primary-green border-2 border-primary-green/20 mb-4">
                                    <WalletIcon size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-text-light mb-1">{selectedWallet?.tag}</h2>
                                <div className="flex items-center gap-2 bg-main px-3 py-1.5 rounded-lg border border-border mb-6">
                                    <span className="font-mono text-xs text-text-medium">{selectedWallet?.addr}</span>
                                    <CheckCircle size={12} className="text-primary-green" />
                                </div>
                                <div className="w-full grid grid-cols-2 gap-3">
                                    <div className="bg-main/50 rounded-lg p-3">
                                        <div className="text-[10px] text-text-dark font-bold uppercase mb-1">Win Rate</div>
                                        <div className="text-lg font-bold text-primary-green">{selectedWallet?.win}</div>
                                    </div>
                                    <div className="bg-main/50 rounded-lg p-3">
                                        <div className="text-[10px] text-text-dark font-bold uppercase mb-1">Total PnL</div>
                                        <div className={`text-lg font-bold ${selectedWallet?.pnl.includes('+') ? 'text-primary-green' : 'text-primary-red'}`}>{selectedWallet?.pnl}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-text-light">Net Worth</h3>
                                    <span className="text-xs text-text-medium bg-main px-2 py-0.5 rounded border border-border">{chain}</span>
                                </div>
                                <div className="text-2xl font-bold text-text-light mb-1">
                                    {portfolioData ? portfolioData.netWorth : selectedWallet?.bal}
                                </div>
                                <div ref={netWorthChartRef} className="w-full min-h-[150px] -ml-2"></div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold text-lg text-text-light">Current Holdings</h3>
                                <div className="flex gap-2">
                                    <button 
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${showDust ? 'bg-primary-green/10 text-primary-green border-primary-green' : 'bg-transparent text-text-medium border-border hover:text-text-light'}`}
                                        onClick={() => setShowDust(!showDust)}
                                    >
                                        <Repeat size={12} /> Show Small Bals
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setLoading(true);
                                            setTimeout(() => setLoading(false), 1000); 
                                        }}
                                        className="p-1.5 bg-card hover:bg-card-hover border border-border rounded-lg text-text-medium hover:text-text-light transition-colors"
                                    >
                                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-card-hover/50 text-xs text-text-dark uppercase font-bold">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Asset</th>
                                            <th className="px-6 py-3 text-right">Balance</th>
                                            <th className="px-6 py-3 text-right">Value (USD)</th>
                                            <th className="px-6 py-3 text-right">Avg Buy</th>
                                            <th className="px-6 py-3 text-right">PnL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-text-medium">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <RefreshCw className="animate-spin text-primary-green" size={24} />
                                                        <span>Scanning Blockchain...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : !portfolioData || portfolioData.assets.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-text-medium">No assets found on this chain.</td>
                                            </tr>
                                        ) : (
                                            portfolioData.assets
                                            .filter(a => showDust || a.rawValue > 1) 
                                            .slice(0, visibleCount)
                                            .map((asset, i) => (
                                                <tr 
                                                    key={i} 
                                                    className="hover:bg-card-hover/20 transition-colors cursor-pointer group"
                                                    onClick={() => onTokenSelect && onTokenSelect(asset.address || asset.symbol)}
                                                    title={`View ${asset.symbol} details`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={asset.logo} alt={asset.symbol} className="w-8 h-8 rounded-full bg-main border border-border" onError={(e) => e.currentTarget.src='https://via.placeholder.com/32'} />
                                                            <div>
                                                                <div className="font-bold text-text-light group-hover:text-primary-green transition-colors">{asset.symbol}</div>
                                                                <div className="text-[10px] text-text-medium">{chain}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-text-light">{asset.balance}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-text-light">{asset.value}</td>
                                                    <td className="px-6 py-4 text-right font-medium text-text-medium">
                                                        {asset.avgBuy || <span className="opacity-50">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {asset.pnl ? (
                                                            <span className={`font-bold ${asset.pnlPercent && asset.pnlPercent >= 0 ? 'text-primary-green' : 'text-primary-red'}`}>
                                                                {asset.pnl}
                                                            </span>
                                                        ) : (
                                                            <span className="text-text-dark text-xs">Simulated</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {portfolioData && portfolioData.assets.length > visibleCount && (
                                <div className="p-4 border-t border-border flex justify-center">
                                    <button 
                                        className="text-xs font-bold text-text-medium hover:text-text-light transition-colors"
                                        onClick={() => setVisibleCount(prev => prev + 10)}
                                    >
                                        Load More Assets
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
