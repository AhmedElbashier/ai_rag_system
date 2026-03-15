"use client";

import { CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Error creating checkout session. Please try again or log in.");
        router.push('/');
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 dark">
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />

      <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Supercharge your <span className="text-primary">Workflow</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Start for free to try the Intelligent Hub. Upgrade to Pro when you're ready for unlimited cognitive capabilities.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full px-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        {/* Free Tier */}
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-xl relative flex flex-col hover:border-border transition-colors">
          <CardHeader>
             <CardTitle className="text-2xl">Starter</CardTitle>
             <CardDescription>Perfect for exploring the features.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
             <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-foreground tracking-tight">$0</span>
                <span className="text-muted-foreground ml-2">/mo</span>
             </div>
             <ul className="space-y-4">
               {[
                 "Upload up to 3 PDFs",
                 "Standard query speed",
                 "100 AI chats per month",
                 "Basic page source citations"
               ].map((feature, i) => (
                 <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{feature}</span>
                 </li>
               ))}
             </ul>
          </CardContent>
          <CardFooter>
             <Button variant="outline" className="w-full py-6 rounded-xl border-border/50" onClick={() => router.push('/')}>
               Get Started Free
             </Button>
          </CardFooter>
        </Card>

        {/* Pro Tier */}
        <Card className="border-2 border-primary shadow-2xl bg-card relative flex flex-col relative overflow-hidden scale-100 md:scale-105 z-10">
          <div className="absolute top-0 right-0 p-3 bg-primary text-primary-foreground font-semibold text-xs rounded-bl-xl shadow-lg flex items-center gap-1 z-20">
            <Zap className="h-4 w-4 fill-primary-foreground" /> Most Popular
          </div>
          
          <CardHeader>
             <CardTitle className="text-2xl text-primary">Pro</CardTitle>
             <CardDescription>For professionals scaling their workflows.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
             <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-foreground tracking-tight">$19</span>
                <span className="text-muted-foreground ml-2">/mo</span>
             </div>
             <ul className="space-y-4">
               {[
                 "Unlimited PDF Uploads",
                 "Fastest Priority query queues",
                 "Unlimited AI continuous chats",
                 "Advanced contextual chunking source linking",
                 "Priority Email Support"
               ].map((feature, i) => (
                 <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-foreground font-medium">{feature}</span>
                 </li>
               ))}
             </ul>
          </CardContent>
          <CardFooter>
             <Button className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/20" 
                     onClick={handleSubscribe} 
                     disabled={loading}>
               {loading ? "Redirecting to Checkout..." : "Upgrade to Pro"}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
