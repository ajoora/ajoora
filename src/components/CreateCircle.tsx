import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreateCircleProps {
  onCircleCreated?: () => void;
}

const CreateCircle = ({ onCircleCreated }: CreateCircleProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "",
    maxMembers: "10",
    frequency: "monthly",
    startDate: undefined as Date | undefined,
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name || !formData.contributionAmount || !formData.startDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from("circles")
        .insert({
          name: formData.name,
          description: formData.description,
          contribution_amount: parseInt(formData.contributionAmount),
          max_members: parseInt(formData.maxMembers),
          frequency: formData.frequency,
          start_date: format(formData.startDate, 'yyyy-MM-dd'),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator as the first member
      await supabase
        .from("circle_members")
        .insert({
          circle_id: data.id,
          user_id: user.id,
          position: 1,
        });

      toast({
        title: "Circle Created!",
        description: "Your circle has been created successfully.",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        contributionAmount: "",
        maxMembers: "10",
        frequency: "monthly",
        startDate: undefined,
      });

      onCircleCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create circle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Circle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Circle Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Weekend Savers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contributionAmount">Contribution Amount (NGN) *</Label>
              <Input
                id="contributionAmount"
                type="number"
                placeholder="1000"
                value={formData.contributionAmount}
                onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your circle's purpose and rules..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max Members</Label>
              <Select
                value={formData.maxMembers}
                onValueChange={(value) => setFormData({ ...formData, maxMembers: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} members
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({ ...formData, startDate: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? "Creating Circle..." : "Create Circle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateCircle;