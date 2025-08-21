import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUp, ArrowDown, GripVertical, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: string;
  user_id: string;
  position: number | null;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface MemberReorderProps {
  members: Member[];
  circleId: string;
  onReorderComplete: () => void;
}

const MemberReorder = ({ members, circleId, onReorderComplete }: MemberReorderProps) => {
  const [reorderedMembers, setReorderedMembers] = useState<Member[]>(
    members.sort((a, b) => (a.position || 999) - (b.position || 999))
  );
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const moveUp = (index: number) => {
    if (index === 0) return;
    
    const newMembers = [...reorderedMembers];
    [newMembers[index], newMembers[index - 1]] = [newMembers[index - 1], newMembers[index]];
    setReorderedMembers(newMembers);
  };

  const moveDown = (index: number) => {
    if (index === reorderedMembers.length - 1) return;
    
    const newMembers = [...reorderedMembers];
    [newMembers[index], newMembers[index + 1]] = [newMembers[index + 1], newMembers[index]];
    setReorderedMembers(newMembers);
  };

  const resetOrder = () => {
    setReorderedMembers([...members].sort((a, b) => (a.position || 999) - (b.position || 999)));
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      // Update positions for all members  
      const updatePromises = reorderedMembers.map((member, index) =>
        supabase
          .from("circle_members")
          .update({ position: index + 1 })
          .eq("id", member.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for errors
      for (const result of results) {
        if (result.error) throw result.error;
      }

      toast({
        title: "Order Updated",
        description: "Member positions have been updated successfully.",
      });

      setOpen(false);
      onReorderComplete();
    } catch (error: any) {
      console.error("Error updating member order:", error);
      toast({
        title: "Error",
        description: "Failed to update member order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GripVertical className="w-4 h-4 mr-2" />
          Reorder Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reorder Members</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Drag or use arrows to reorder members
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetOrder}
              className="text-muted-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reorderedMembers.map((member, index) => (
              <Card key={member.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === reorderedMembers.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                      #{index + 1}
                    </div>
                    
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-medium text-sm">
                        {member.profiles?.full_name || 'Unknown User'}
                      </p>
                    </div>
                  </div>
                  
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={saveOrder}
              disabled={saving}
              className="flex-1"
            >
              {saving ? "Saving..." : "Save Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberReorder;