import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-transparent rounded-lg flex items-center justify-center">
              {/* <span className="text-primary font-bold text-sm">D</span>
               */}
              <img style={{width: '70px'}} src="/logo.png" alt="Logo" />
            </div>
            {/* <span className="text-white font-bold text-xl">DumpSpace</span> */}
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-white hover:text-white/80 font-medium transition-colors ${
                location.pathname === '/' ? 'text-accent' : ''
              }`}
            >
              Home
            </Link>
            
            <Link 
              to="/categories" 
              className={`text-white hover:text-white/80 font-medium transition-colors ${
                location.pathname === '/categories' ? 'text-accent' : ''
              }`}
            >
              Categories
            </Link>

            <Link 
              to="/leaderboard" 
              className={`text-white hover:text-white/80 font-medium transition-colors ${
                location.pathname === '/leaderboard' ? 'text-accent' : ''
              }`}
            >
              Leaderboard
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* <Button variant="nav" className="flex items-center gap-1">
                  More <ChevronDown className="w-4 h-4" />
                </Button> */}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem>About</DropdownMenuItem>
                <DropdownMenuItem>FAQ</DropdownMenuItem>
                <DropdownMenuItem>Contact</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="secondary" className="bg-white/20 text-white border border-white/30 hover:bg-white/30">
              Submit Dump
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;