import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Users, Calendar, DollarSign } from "lucide-react";

const CircleDetails = () => {
  const circleData = {
    title: "1k to Pack 20k",
    host: "Daniels Moris",
    walletAmount: "NGN 13,000.00",
    startDate: "12th June 2024",
    amount: "NGN 1000.00",
    penaltyFee: "NGN 100.00",
    frequency: "Weekly",
    payout: "Randomly"
  };

  const members = [
    { name: "Anita Amelo", status: "New Request", avatar: "/lovable-uploads/40f3532e-33b6-4665-9243-6481385d1a5a.png" },
    { name: "Keleb Antio", status: "Active", position: 2, avatar: "/lovable-uploads/40f3532e-33b6-4665-9243-6481385d1a5a.png" },
    { name: "Marai Leo", status: "Active", position: 8, avatar: "/lovable-uploads/40f3532e-33b6-4665-9243-6481385d1a5a.png" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Circle Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">{circleData.title}</h1>
        
        <div className="flex items-center justify-center space-x-4">
          <Avatar className="w-20 h-20 ring-4 ring-primary/20">
            <AvatarImage src="/lovable-uploads/40f3532e-33b6-4665-9243-6481385d1a5a.png" />
            <AvatarFallback>DM</AvatarFallback>
          </Avatar>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-foreground">{circleData.host}</h2>
          <Badge variant="secondary" className="mt-1">Host</Badge>
        </div>
        
        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
              <p className="text-center text-2xl font-bold text-primary">{circleData.walletAmount}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  <strong className="text-primary">Instructions:</strong><br />
                  Lorem dolor sit amet, consectetur adipiscing elit. Duis in feugiat elit. Ut non
                  neque velit. Morbi dictum felis id.
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-medium">{circleData.startDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{circleData.amount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Penalty Fee</span>
                    <span className="font-medium">{circleData.penaltyFee}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium">{circleData.frequency}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Payout</span>
                    <span className="font-medium">{circleData.payout}</span>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-primary hover:bg-primary/90">
                    Edit Circle
                  </Button>
                  <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Assign position to yourself
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="space-y-3">
            {members.map((member, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      {member.status === "New Request" && (
                        <Badge variant="secondary" className="text-xs">New Request</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.position && (
                      <Badge variant="outline" className="bg-primary text-primary-foreground border-primary">
                        {member.position}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Contribution</span>
                  <span className="font-semibold text-primary">NGN 1,000</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Penalty Fee</span>
                  <span className="font-semibold text-primary">NGN 100</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Contribution</span>
                  <span className="font-semibold text-primary">NGN 1,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instruction">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis in feugiat elit. 
                Ut non neque velit. Morbi dictum felis id.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CircleDetails;