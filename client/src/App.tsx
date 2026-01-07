import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UIProvider } from "@/hooks/use-ui";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Settings from "@/pages/settings";
import TitleDemo from "@/pages/title-demo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/settings" component={Settings}/>
      <Route path="/title" component={TitleDemo}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}

export default App;
