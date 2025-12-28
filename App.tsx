import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { AuthScreen } from './views/Auth';
import { Dashboard } from './views/Dashboard';
import { TokenDetails } from './views/TokenDetails';
import { KolFeed } from './views/KolFeed';
import { Heatmap } from './views/Heatmap';
import { Sentiment } from './views/Sentiment';
import { Detection } from './views/Detection';
import { TokenDetection } from './views/TokenDetection';
import { Virality } from './views/Virality';
import { Chatbot } from './views/Chatbot';
import { WalletTracking } from './views/WalletTracking';
import { SafeScan } from './views/SafeScan';
import { ViewState, MarketCoin } from './types';

// Placeholder components for views not yet implemented
const PlaceholderView = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center p-6 animate-fade-in">
    <h2 className="text-2xl font-bold mb-2 text-text-light">{title}</h2>
    <p className="text-text-medium">This feature is coming soon.</p>
  </div>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('overview');
  const [selectedToken, setSelectedToken] = useState<MarketCoin | string | null>(null);
  const [selectedDetectionToken, setSelectedDetectionToken] = useState<string | null>(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView('overview');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('overview'); // Stay on overview as guest
    setSelectedToken(null);
  };

  const handleAuthRequest = () => {
    setCurrentView('auth');
  };

  const handleTokenSelect = (token: MarketCoin | string) => {
    setSelectedToken(token);
    setCurrentView('token-details');
  };

  const handleDetectionSearch = (query: string) => {
    setSelectedDetectionToken(query);
    setCurrentView('token-detection');
  };

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <Dashboard onTokenSelect={handleTokenSelect} />;
      case 'token-details':
        return selectedToken ? (
          <TokenDetails token={selectedToken} onBack={() => setCurrentView('overview')} />
        ) : (
          <Dashboard onTokenSelect={handleTokenSelect} />
        );
      case 'kol-feed':
        return <KolFeed />;
      case 'heatmap':
        return <Heatmap />;
      case 'sentiment':
        return <Sentiment />;
      case 'detection':
        return <Detection onSearch={handleDetectionSearch} />;
      case 'token-detection':
        return selectedDetectionToken ? (
          <TokenDetection token={selectedDetectionToken} onBack={() => setCurrentView('detection')} />
        ) : (
          <Detection onSearch={handleDetectionSearch} />
        );
      case 'virality':
        return <Virality />;
      case 'chatbot':
        return <Chatbot />;
      case 'wallet-tracking':
        return <WalletTracking />;
      case 'safe-scan':
        return <SafeScan />;
      case 'smart-money':
        return <PlaceholderView title="Smart Money Tracking" />;
      case 'custom-alerts':
        return <PlaceholderView title="Custom Alerts" />;
      case 'settings':
        return <PlaceholderView title="Settings" />;
      default:
        return <Dashboard onTokenSelect={handleTokenSelect} />;
    }
  };

  if (currentView === 'auth') {
    return <AuthScreen onLogin={handleLogin} onSkip={() => setCurrentView('overview')} />;
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={handleLogout}
      isAuthenticated={isAuthenticated}
      onLogin={handleAuthRequest}
    >
      {renderView()}
    </Layout>
  );
}