import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface CircleCardProps {
  title: string;
  amount: string;
  slotsLeft: number;
  totalSlots: number;
  frequency: string;
}

const CircleCard = ({ title, amount, slotsLeft, totalSlots, frequency }: CircleCardProps) => {
  return (
    <Card className="bg-accent/30 border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer">
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-2 text-foreground">{title}</h3>
        <p className="text-2xl font-bold text-primary mb-4">{amount}</p>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Users className="w-3 h-3 mr-1" />
            {frequency}
          </Badge>
          <span className="text-sm text-muted-foreground">
            <Users className="w-4 h-4 inline mr-1" />
            {slotsLeft} out of {totalSlots} slots left
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CircleCard;