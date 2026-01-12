'use client'

import { useState } from 'react'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { MarketList } from './components/MarketList'
import { PortfolioHeader } from './components/PortfolioHeader'

export default function Home() {
  const [filter, setFilter] = useState<'open' | 'resolved'>('open')

  return (
    <div className="app">
      <Header />
      
      <main className="app-content with-bottom-nav">
        {/* Portfolio Header */}
        <PortfolioHeader />

        {/* Tabs */}
        <div className="nav-tabs animate-fade-in">
          <button 
            className={`nav-tab btn-press ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open Markets
          </button>
          <button 
            className={`nav-tab btn-press ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>

        {/* Market List */}
        <MarketList filter={filter} />

      </main>

      <BottomNav active="home" />
    </div>
  )
}

