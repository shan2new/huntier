import { Link } from '@tanstack/react-router'
import logo512 from '/logo512.svg'

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={logo512} alt="Huntier logo" className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">Huntier</span>
            <span className="text-xs text-muted-foreground font-medium -mt-1">Job hunting, simplified</span>
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
