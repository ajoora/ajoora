import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Check, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Invitation {
  id: string;
  circle_id: string;
  email: string;
  status: string;
  invited_at: string;
  expires_at: string;
  circles?: {
    name: string;
    description: string;
    contribution_amount: number;
    frequency: string;
    max_members: number;
  } | null;
  profiles?: {
    full_name: string;
  } | null;
}

const PendingInvites = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && open) {
      fetchPendingInvitations();
    }
  }, [user, open]);

  const fetchPendingInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          id,
          circle_id,
          email,
          status,
          invited_at,
          expires_at,
          circles(name, description, contribution_amount, frequency, max_members),
          profiles(full_name)
        `)
        .eq("email", user?.email)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("invited_at", { ascending: false });

      if (error) {
        console.error("Query error:", error);
        throw error;
      }
      console.log("Fetched invitations:", data);
      setInvitations((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Error",
        description: "Failed to load pending invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation: Invitation) => {
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("circle_members")
        .select("id")
        .eq("circle_id", invitation.circle_id)
        .eq("user_id", user?.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a Member",
          description: "You are already a member of this circle.",
          variant: "destructive",
        });
        return;
      }

      // Add user to circle_members
      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({
          circle_id: invitation.circle_id,
          user_id: user?.id,
          status: "active",
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from("invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      if (inviteError) throw inviteError;

      toast({
        title: "Invitation Accepted!",
        description: `You've joined ${invitation.circles?.name} successfully.`,
      });

      // Refresh invitations list
      fetchPendingInvitations();
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "declined" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation Declined",
        description: "You've declined the invitation.",
      });

      fetchPendingInvitations();
    } catch (error: any) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative">
          <Mail className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Invites</span>
          {invitations.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {invitations.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <div className="bg-primary rounded-lg p-2">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            Pending Invitations
            {invitations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {invitations.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse border-border">
                  <CardContent className="p-4">
                    <div className="h-5 bg-muted rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="flex gap-2 mt-4">
                      <div className="h-8 bg-muted rounded flex-1"></div>
                      <div className="h-8 bg-muted rounded flex-1"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 border-border bg-muted/20">
              <div className="bg-accent rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">No Pending Invitations</h3>
              <p className="text-muted-foreground">You'll see circle invitations here when you receive them.</p>
            </Card>
          ) : (
            invitations.map((invitation) => (
              <Card key={invitation.id} className="border-l-4 border-l-primary bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-card-foreground">{invitation.circles?.name || "Unknown Circle"}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">
                      Expires {format(new Date(invitation.expires_at), 'MMM dd')}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Invited by <span className="font-medium">{invitation.profiles?.full_name || "Unknown"}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invitation.circles?.description && (
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      {invitation.circles.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 p-3 bg-accent/10 rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Contribution</div>
                      <div className="font-semibold text-primary">
                        ₦{invitation.circles?.contribution_amount?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Frequency</div>
                      <div className="font-semibold text-primary capitalize">
                        {invitation.circles?.frequency || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleAcceptInvitation(invitation)}
                      className="flex-1 bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept Invitation
                    </Button>
                    <Button
                      onClick={() => handleDeclineInvitation(invitation.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingInvites;