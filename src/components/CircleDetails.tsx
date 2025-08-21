import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Users, Calendar, DollarSign, ArrowLeft, Edit, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Header from "./Header";
import InviteMembers from "./InviteMembers";
import MemberReorder from "./MemberReorder";

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
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  position: number | null;
  joined_at: string;
  status: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface Contribution {
  id: string;
  amount: number;
  contribution_date: string;
  status: string;
  payment_method: string;
  profiles?: {
    full_name: string;
  } | null;
}

const CircleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWallet, setTotalWallet] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCircleDetails();
      fetchMembers();
      fetchContributions();
    }
  }, [id]);

  const fetchCircleDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("circles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setCircle(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load circle details",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchMembers = async () => {
    try {
      // First get the circle members
      const { data: membersData, error: membersError } = await supabase
        .from("circle_members")
        .select("*")
        .eq("circle_id", id)
        .order("position", { ascending: true, nullsFirst: false });

      if (membersError) throw membersError;

      // Then get profiles for each member
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const membersWithProfiles = membersData.map(member => ({
          ...member,
          profiles: profilesData?.find(p => p.user_id === member.user_id) || null
        }));

        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }
    } catch (error: any) {
      console.error("Error fetching members:", error);
      setMembers([]);
    }
  };

  const fetchContributions = async () => {
    try {
      // Get contributions
      const { data: contributionsData, error: contributionsError } = await supabase
        .from("contributions")
        .select("*")
        .eq("circle_id", id)
        .eq("status", "completed")
        .order("contribution_date", { ascending: false });

      if (contributionsError) throw contributionsError;

      if (contributionsData && contributionsData.length > 0) {
        // Get profiles for contributors
        const userIds = contributionsData.map(c => c.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const contributionsWithProfiles = contributionsData.map(contribution => ({
          ...contribution,
          profiles: profilesData?.find(p => p.user_id === contribution.user_id) || null
        }));

        setContributions(contributionsWithProfiles);
        
        // Calculate total wallet amount
        const total = contributionsData.reduce((sum, contribution) => sum + contribution.amount, 0);
        setTotalWallet(total);
      } else {
        setContributions([]);
        setTotalWallet(0);
      }
    } catch (error: any) {
      console.error("Error fetching contributions:", error);
      setContributions([]);
      setTotalWallet(0);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/circle/${id}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Success",
      description: "Invite link copied to clipboard!",
    });
  };

  const isHost = circle?.created_by === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-20 bg-muted rounded-full w-20 mx-auto"></div>
            <div className="h-6 bg-muted rounded w-1/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Circle not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Circles
        </Button>
        {/* Circle Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary">{circle.name}</h1>
          
          <div className="flex items-center justify-center space-x-4">
            <Avatar className="w-20 h-20 ring-4 ring-primary/20">
              <AvatarFallback>{circle.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          
          <div>
            <Badge variant={circle.status === 'active' ? 'default' : 'secondary'} className="mt-1">
              {circle.status}
            </Badge>
            {isHost && <Badge variant="outline" className="ml-2">Host</Badge>}
          </div>
          
          <Button 
            variant="outline" 
            onClick={copyInviteLink}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Invite Link
          </Button>
        </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Details
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Members
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            History
          </TabsTrigger>
          <TabsTrigger value="instruction" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Instruction
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-muted-foreground text-sm">Circle Wallet</CardTitle>
              <p className="text-center text-2xl font-bold text-primary">₦{totalWallet.toLocaleString()}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {circle.description && (
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong className="text-primary">Description:</strong><br />
                    {circle.description}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-medium">{format(new Date(circle.start_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Contribution Amount</span>
                    <span className="font-medium">₦{circle.contribution_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Max Members</span>
                    <span className="font-medium">{circle.max_members}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium">{circle.frequency}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Current Members</span>
                    <span className="font-medium">{members.length}/{circle.max_members}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={circle.status === 'active' ? 'default' : 'secondary'}>
                      {circle.status}
                    </Badge>
                  </div>
                </div>
                
                {isHost && (
                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 bg-primary hover:bg-primary/90">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Circle
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Members ({members.length}/{circle.max_members})</h3>
            {isHost && (
              <div className="flex gap-2">
                <MemberReorder 
                  members={members}
                  circleId={circle.id}
                  onReorderComplete={fetchMembers}
                />
                <InviteMembers 
                  circleId={circle.id} 
                  circleName={circle.name}
                  onInvitesSent={fetchMembers}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {members.length === 0 ? (
              <Card className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No members yet</p>
              </Card>
            ) : (
              members.map((member) => (
                <Card key={member.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{member.profiles?.full_name || 'Unknown User'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Joined {format(new Date(member.joined_at), 'MMM dd, yyyy')}
                        </p>
                        <Badge 
                          variant={member.status === 'active' ? 'default' : 'secondary'} 
                          className="text-xs mt-1"
                        >
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.position && (
                        <Badge variant="outline" className="bg-primary text-primary-foreground border-primary">
                          Position {member.position}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Contribution History</h3>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {contributions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No contributions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contributions.map((contribution) => (
                    <div key={contribution.id} className="flex justify-between items-center py-3 border-b border-border last:border-b-0">
                      <div>
                        <p className="font-medium">{contribution.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(contribution.contribution_date), 'MMM dd, yyyy')} • {contribution.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">₦{contribution.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="text-xs">
                          {contribution.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instruction">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Circle Instructions</h3>
              {circle.description ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{circle.description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No instructions provided for this circle.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default CircleDetails;