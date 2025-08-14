import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="headerIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#3B82F6', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:'#1D4ED8', stopOpacity:1}} />
                </linearGradient>
                <linearGradient id="headerTierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#60A5FA', stopOpacity:0.8}} />
                  <stop offset="100%" style={{stopColor:'#3B82F6', stopOpacity:0.6}} />
                </linearGradient>
              </defs>
              
              {/* Background circle for better icon definition */}
              <circle cx="24" cy="24" r="22" fill="url(#headerIconGradient)" opacity="0.1"/>
              
              {/* H symbol with tier elements for icon */}
              <g fill="url(#headerIconGradient)">
                {/* Main H structure */}
                <rect x="12" y="12" width="4" height="24" rx="2"/>
                <rect x="32" y="12" width="4" height="24" rx="2"/>
                <rect x="12" y="22" width="24" height="4" rx="2"/>
                
                {/* Tier steps ascending - simplified for icon */}
                <rect x="38" y="32" width="6" height="2" rx="1" fill="url(#headerTierGradient)"/>
                <rect x="40" y="28" width="6" height="2" rx="1" fill="url(#headerTierGradient)"/>
                <rect x="42" y="24" width="4" height="2" rx="1" fill="url(#headerIconGradient)"/>
              </g>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">huntier</span>
            <span className="text-xs text-muted-foreground font-medium -mt-1">Modern Tier Job hunting</span>
          </div>
        </Link>
      </div>
      
      <nav className="flex items-center gap-6">
        <Link 
          to="/" 
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Home
        </Link>
      </nav>
    </header>
  )
}
