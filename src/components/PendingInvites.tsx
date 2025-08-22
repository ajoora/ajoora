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
          *,
          circles(name, description, contribution_amount, frequency, max_members),
          profiles!invitations_invited_by_fkey(full_name)
        `)
        .eq("email", user?.email)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("invited_at", { ascending: false });

      if (error) throw error;
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
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20 relative">
          <Mail className="w-4 h-4 mr-2" />
          Invites
          {invitations.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {invitations.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pending Invitations ({invitations.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending invitations</p>
            </Card>
          ) : (
            invitations.map((invitation) => (
              <Card key={invitation.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{invitation.circles?.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Invited by {invitation.profiles?.full_name || "Unknown"}</span>
                    <Badge variant="outline" className="text-xs">
                      Expires {format(new Date(invitation.expires_at), 'MMM dd')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invitation.circles?.description && (
                    <p className="text-sm text-muted-foreground">
                      {invitation.circles.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium ml-1">
                        ₦{invitation.circles?.contribution_amount?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-medium ml-1 capitalize">
                        {invitation.circles?.frequency}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleAcceptInvitation(invitation)}
                      className="flex-1"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDeclineInvitation(invitation.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
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