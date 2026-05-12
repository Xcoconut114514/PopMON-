import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import { wagmiConfig } from './config'
import { LangProvider, useLang } from './i18n'
import { HomePage } from './pages/HomePage'
import { OpenPackPage } from './pages/OpenPackPage'
import { CollectionPage } from './pages/CollectionPage'

const queryClient = new QueryClient()

type Page = 'home' | 'openPack' | 'collection'

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home')
  const [selectedPoolId, setSelectedPoolId] = useState<bigint>(0n)
  const { t } = useLang()

  const handleSelectPool = (poolId: bigint) => {
    setSelectedPoolId(poolId)
    setPage('openPack')
  }

  return (
    <>
      {page === 'home' && (
        <HomePage onSelectPool={handleSelectPool} />
      )}
      {page === 'openPack' && (
        <OpenPackPage poolId={selectedPoolId} onBack={() => setPage('home')} />
      )}
      {page === 'collection' && (
        <CollectionPage onBack={() => setPage('home')} />
      )}

      {/* Floating collection button */}
      {page === 'home' && (
        <button
          onClick={() => setPage('collection')}
          className="fixed bottom-6 right-6 bg-monad-dark border-4 border-monad-purple px-4 py-3 text-[8px] text-monad-purple shadow-neon-purple hover:bg-monad-purple hover:text-white transition-colors font-pixel z-40"
        >
          {t.myCards}
        </button>
      )}
    </>
  )
}

const container = document.getElementById('root')!
createRoot(container).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: '#836EF9',
          accentColorForeground: 'white',
          borderRadius: 'none',
          fontStack: 'system',
        })}
      >
        <LangProvider>
          <App />
        </LangProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
)
