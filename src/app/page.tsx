
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 md:p-6 border-b bg-card">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Icons.logo className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-primary font-headline">
                    InfluenceFinder
                </h1>
            </div>
            <div className="flex items-center gap-2">
                 <Button asChild variant="ghost">
                    <Link href="/login">Login</Link>
                </Button>
                 <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto text-center py-20 md:py-32">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight font-headline">
            Discover Your Next Influencer
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Our powerful search tools help you find the perfect influencers for your brand, filtering by location, category, followers, engagement, and more.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
              <Link href="/login">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="bg-background py-16">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <div>
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto mb-4">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <h3 className="text-xl font-bold font-headline">Advanced Search</h3>
                        <p className="text-muted-foreground mt-2">Filter by niche, engagement, follower count, and location to find the perfect match.</p>
                    </div>
                     <div>
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold font-headline">AI Recommendations</h3>
                        <p className="text-muted-foreground mt-2">Get AI-powered suggestions for keywords and categories to broaden your search.</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <h3 className="text-xl font-bold font-headline">CSV Export</h3>
                        <p className="text-muted-foreground mt-2">Easily export your search results to CSV for offline analysis and reporting.</p>
                    </div>
                </div>
            </div>
        </section>
      </main>
      <footer className="p-4 md:p-6 mt-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Built with Next.js and ShadCN. Powered by Ylytic API on RapidAPI.
          </p>
        </div>
      </footer>
    </div>
  );
}
