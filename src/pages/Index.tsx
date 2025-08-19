import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CircleDetails from "@/components/CircleDetails";
import CreateCircle from "@/components/CreateCircle";
import InviteMembers from "@/components/InviteMembers";
import CirclesList from "@/components/CirclesList";
import ProfileEdit from "@/components/ProfileEdit";

type ViewType = "list" | "details" | "create" | "invite" | "profile";

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
}

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);

  useEffect(() => {
    const handleOpenProfile = () => {
      setCurrentView("profile");
    };

    window.addEventListener('openProfile', handleOpenProfile);
    return () => window.removeEventListener('openProfile', handleOpenProfile);
  }, []);

  const handleCreateCircle = () => {
    setCurrentView("create");
  };

  const handleSelectCircle = (circle: Circle) => {
    setSelectedCircle(circle);
    setCurrentView("details");
  };

  const handleCircleCreated = () => {
    setCurrentView("list");
  };

  const handleInviteMembers = (circle: Circle) => {
    setSelectedCircle(circle);
    setCurrentView("invite");
  };

  const handleCloseProfile = () => {
    setCurrentView("list");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "create":
        return <CreateCircle onCircleCreated={handleCircleCreated} />;
      case "details":
        return selectedCircle ? <CircleDetails /> : <CirclesList onCreateCircle={handleCreateCircle} onSelectCircle={handleSelectCircle} />;
      case "invite":
        return selectedCircle ? (
          <InviteMembers 
            circleId={selectedCircle.id} 
            circleName={selectedCircle.name}
          />
        ) : <CirclesList onCreateCircle={handleCreateCircle} onSelectCircle={handleSelectCircle} />;
      case "profile":
        return <ProfileEdit onClose={handleCloseProfile} />;
      default:
        return <CirclesList onCreateCircle={handleCreateCircle} onSelectCircle={handleSelectCircle} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Header />
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Index;
