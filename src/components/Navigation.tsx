import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
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
              <img style={{ width: "70px" }} src="/logo.png" alt="Logo" />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-white hover:text-white/80 font-medium transition-colors ${
                location.pathname === "/" ? "text-accent" : ""
              }`}
            >
              Home
            </Link>

            <Link
              to="/categories"
              className={`text-white hover:text-white/80 font-medium transition-colors ${
                location.pathname === "/categories" ? "text-accent" : ""
              }`}
            >
              Categories
            </Link>

            <Link
              to="/leaderboard"
              className={`text-white hover:text-white/80 font-medium transition-colors ${
                location.pathname === "/leaderboard" ? "text-accent" : ""
              }`}
            >
              Leaderboard
            </Link>
          </div>

          {/* Right Section (Auth + Mobile Menu) */}
          <div className="flex items-center space-x-4">
            {/* Auth Buttons (if any in future) */}

            {/* Mobile Navigation Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                  >
                    <Menu className="w-6 h-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem>
                    <Link to="/" className="w-full block">
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/categories" className="w-full block">
                      Categories
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/leaderboard" className="w-full block">
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
