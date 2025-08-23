import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Users, CreditCard, User, LogOut, ChevronDown, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PendingInvites from "./PendingInvites";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6 h-16">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AJORO
          </h1>
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
            <Users className="w-4 h-4 mr-2" />
            Circles
          </Button>
          <Button variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
            <Search className="w-4 h-4 mr-2" />
            Explore
          </Button>
          <Button variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
            <CreditCard className="w-4 h-4 mr-2" />
            Transactions
          </Button>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <PendingInvites />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Account</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-popover-foreground">My Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => window.dispatchEvent(new CustomEvent('openProfile'))}
                className="text-popover-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={signOut}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;