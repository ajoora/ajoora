import Header from "@/components/Header";
import CircleDetails from "@/components/CircleDetails";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Header />
        <CircleDetails />
      </div>
    </div>
  );
};

export default Index;
