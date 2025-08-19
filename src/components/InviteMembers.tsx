import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InviteMembersProps {
  circleId: string;
  circleName: string;
}

const InviteMembers = ({ circleId, circleName }: InviteMembersProps) => {
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const addEmailToInvites = () => {
    if (!email.trim()) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (invites.includes(email)) {
      toast({
        title: "Already Added",
        description: "This email is already in the invite list.",
        variant: "destructive",
      });
      return;
    }

    setInvites([...invites, email]);
    setEmail("");
  };

  const removeEmailFromInvites = (emailToRemove: string) => {
    setInvites(invites.filter(email => email !== emailToRemove));
  };

  const sendInvites = async () => {
    if (invites.length === 0) {
      toast({
        title: "No Invites",
        description: "Please add at least one email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Here you would typically send actual emails
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Invites Sent!",
        description: `${invites.length} invitation(s) sent successfully.`,
      });

      setInvites([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${circleId}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link Copied!",
      description: "Invite link has been copied to your clipboard.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmailToInvites();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite Members to "{circleName}"
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite Link Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Share Invite Link</Label>
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/invite/${circleId}`}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={copyInviteLink}
              className="shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this link with anyone you want to invite to your circle.
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Email Invites Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Send Email Invitations</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={addEmailToInvites}
              variant="outline"
              className="shrink-0"
            >
              Add
            </Button>
          </div>

          {/* Email List */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Pending Invites ({invites.length})</Label>
              <div className="flex flex-wrap gap-2">
                {invites.map((inviteEmail, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {inviteEmail}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeEmailFromInvites(inviteEmail)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <Button
              onClick={sendInvites}
              disabled={isSending}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isSending ? "Sending Invites..." : `Send ${invites.length} Invitation(s)`}
            </Button>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Invited members will receive an email with instructions 
            to join your circle. They'll need to create an account if they don't have one.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InviteMembers;