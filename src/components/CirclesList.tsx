import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse border-border">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-muted rounded w-12"></div>
                    <div className="h-8 w-8 bg-muted rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Circles</h1>
          <p className="text-muted-foreground mt-1">Manage your savings circles and grow together</p>
        </div>
        <Button onClick={onCreateCircle} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Circle
        </Button>
      </div>

      {circles.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-2 border-border bg-muted/20">
          <CardContent className="pt-6">
            <div className="bg-accent rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Users className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">No Circles Yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Create your first savings circle to start building wealth with friends and family.
            </p>
            <Button onClick={onCreateCircle} size="lg" className="bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Circle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((circle) => (
            <Card 
              key={circle.id} 
              className="cursor-pointer hover:shadow-lg hover:border-accent transition-all duration-200 bg-card border-border"
              onClick={() => navigate(`/circle/${circle.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-card-foreground">{circle.name}</CardTitle>
                  <Badge 
                    variant={circle.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {circle.status}
                  </Badge>
                </div>
                {circle.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {circle.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <DollarSign className="w-4 h-4" />
                    <span>₦{circle.contribution_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{circle.member_count}/{circle.max_members}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{circle.frequency} • Starts {format(new Date(circle.start_date), 'MMM dd')}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    {circle.created_by === user?.id && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        Host
                      </Badge>
                    )}
                    {circle.is_member && circle.created_by !== user?.id && (
                      <Badge variant="secondary" className="text-xs">
                        Member
                      </Badge>
                    )}
                  </div>
                  <Avatar className="w-8 h-8 border-2 border-accent">
                    <AvatarFallback className="text-xs bg-accent text-accent-foreground font-medium">
                      {circle.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
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