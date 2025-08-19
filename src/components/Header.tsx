import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Users, CreditCard, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground p-4 rounded-xl shadow-lg">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-xl font-bold">AJORO</h1>
        </div>
        
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
            <Users className="w-4 h-4 mr-2" />
            Circles
          </Button>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
            <Search className="w-4 h-4 mr-2" />
            Explore
          </Button>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
            <CreditCard className="w-4 h-4 mr-2" />
            Transactions
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
                <User className="w-4 h-4 mr-2" />
                Account
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">My Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openProfile'))}>
                <User className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};

export default Header;