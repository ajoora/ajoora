import { Button } from "@/components/ui/button";
import { Search, Users, CreditCard, User, LogOut } from "lucide-react";
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
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
            <User className="w-4 h-4 mr-2" />
            Accounts
          </Button>
          <div className="ml-4 text-sm opacity-75">
            {user?.email}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;