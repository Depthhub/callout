'use client'

import Link from 'next/link'
import { Home, Search, Plus, BarChart3, User } from 'lucide-react'

interface BottomNavProps {
  active?: 'home' | 'search' | 'portfolio' | 'profile'
}

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {/* Left group */}
        <Link 
          href="/" 
          className={`bottom-nav-item btn-press ${active === 'home' ? 'active' : ''}`}
        >
          {active === 'home' && <span className="bottom-nav-indicator" />}
          <Home size={20} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Home</span>
        </Link>
        
        <Link 
          href="/search" 
          className={`bottom-nav-item btn-press ${active === 'search' ? 'active' : ''}`}
        >
          {active === 'search' && <span className="bottom-nav-indicator" />}
          <Search size={20} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Search</span>
        </Link>

        {/* Center action button */}
        <div className="bottom-nav-center">
          <Link 
            href="/create" 
            className="bottom-nav-fab btn-press"
            aria-label="Create market"
          >
            <Plus size={24} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Right group */}
        <Link 
          href="/my-bets" 
          className={`bottom-nav-item btn-press ${active === 'portfolio' ? 'active' : ''}`}
        >
          {active === 'portfolio' && <span className="bottom-nav-indicator" />}
          <BarChart3 size={20} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Portfolio</span>
        </Link>
        
        <Link 
          href="/profile" 
          className={`bottom-nav-item btn-press ${active === 'profile' ? 'active' : ''}`}
        >
          {active === 'profile' && <span className="bottom-nav-indicator" />}
          <User size={20} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Profile</span>
        </Link>
      </div>
    </nav>
  )
}
