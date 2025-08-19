import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Calendar, DollarSign, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Circle {
  id: string;
  name: string;
  description: string;
  contribution_amount: number;
  max_members: number;
  frequency: string;
  start_date: string;
  status: string;
  created_by: string;
  member_count?: number;
  is_member?: boolean;
}

interface CirclesListProps {
  onCreateCircle: () => void;
  onSelectCircle: (circle: Circle) => void;
}

const CirclesList = ({ onCreateCircle, onSelectCircle }: CirclesListProps) => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCircles();
    }
  }, [user]);

  const fetchCircles = async () => {
    try {
      // First get circles where user is creator or member
      const { data: userCircles, error: circlesError } = await supabase
        .from("circles")
        .select("*")
        .or(`created_by.eq.${user?.id}`)
        .eq("status", "active");

      if (circlesError) throw circlesError;

      // Get circles where user is a member
      const { data: memberCircles, error: memberError } = await supabase
        .from("circle_members")
        .select(`
          circle_id,
          circles!inner(*)
        `)
        .eq("user_id", user?.id);

      if (memberError) throw memberError;

      // Combine and deduplicate circles
      const allCircles = [...(userCircles || [])];
      
      memberCircles?.forEach(member => {
        if (member.circles && !allCircles.find(c => c.id === member.circles.id)) {
          allCircles.push(member.circles);
        }
      });

      // Get member counts for each circle
      const circlesWithCounts = await Promise.all(
        allCircles.map(async (circle) => {
          const { count } = await supabase
            .from("circle_members")
            .select("*", { count: "exact", head: true })
            .eq("circle_id", circle.id);

          return {
            ...circle,
            member_count: count || 0,
            is_member: circle.created_by === user?.id || 
                      memberCircles?.some(mc => mc.circle_id === circle.id)
          };
        })
      );

      setCircles(circlesWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load circles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Circles</h1>
          <p className="text-muted-foreground">Manage your savings circles</p>
        </div>
        <Button onClick={onCreateCircle} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Circle
        </Button>
      </div>

      {circles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Circles Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first savings circle to start building wealth with friends.
            </p>
            <Button onClick={onCreateCircle}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Circle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((circle) => (
            <Card 
              key={circle.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onSelectCircle(circle)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{circle.name}</CardTitle>
                  <Badge className={getStatusColor(circle.status)}>
                    {circle.status}
                  </Badge>
                </div>
                {circle.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {circle.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>₦{circle.contribution_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{circle.member_count}/{circle.max_members}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{circle.frequency} • Starts {format(new Date(circle.start_date), 'MMM dd')}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {circle.created_by === user?.id && (
                      <Badge variant="outline" className="text-xs">Host</Badge>
                    )}
                    {circle.is_member && circle.created_by !== user?.id && (
                      <Badge variant="secondary" className="text-xs">Member</Badge>
                    )}
                  </div>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {circle.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CirclesList;