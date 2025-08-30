import { SlotMachine } from "../components/SlotMachine";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="neon-text mb-4">VEGAS SLOTS</h1>
          <p className="text-muted-foreground text-xl font-casino-light">
            Try your luck at the ultimate slot machine experience
          </p>
        </header>
        
        <main className="flex justify-center">
          <SlotMachine />
        </main>
        
        <footer className="text-center mt-12 text-muted-foreground">
          <p className="font-casino-light">Play responsibly • For entertainment only</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;