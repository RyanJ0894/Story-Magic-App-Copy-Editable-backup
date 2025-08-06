import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-foreground">Story Magic</h1>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Get Started
            </button>
          </div>
        </div>
      </header>
      
      <main className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Story Magic</h1>
          <p className="text-muted-foreground">Transform Scripts into Cinematic Audio</p>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
