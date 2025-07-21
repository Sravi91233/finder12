
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Icons } from '@/components/icons';

const plans = [
    {
        name: 'Basic',
        price: '19',
        description: 'For individuals and small teams getting started.',
        features: [
            'Up to 500 searches/month',
            'Basic search filters',
            'CSV Export',
            'Email support'
        ],
        cta: 'Get Started'
    },
    {
        name: 'Pro',
        price: '49',
        description: 'For growing businesses and power users.',
        features: [
            'Up to 2,000 searches/month',
            'Advanced search filters',
            'AI keyword suggestions',
            'Saved influencer lists',
            'Priority email support'
        ],
        cta: 'Upgrade to Pro',
        popular: true
    },
    {
        name: 'Enterprise',
        price: 'Contact Us',
        description: 'For large organizations with custom needs.',
        features: [
            'Unlimited searches',
            'Dedicated account manager',
            'API Access',
            'Custom integrations',
            '24/7 phone support'
        ],
        cta: 'Contact Sales'
    }
]

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 md:p-6 border-b bg-card">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                    <Icons.logo className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold text-primary font-headline">
                        InfluenceFinder
                    </h1>
                </Link>
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
        <section className="container mx-auto text-center py-16 md:py-24">
             <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline">
                Find the Plan That's Right for You
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Simple, transparent pricing. No hidden fees.
            </p>
        </section>

        <section className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(plan => (
                    <Card key={plan.name} className={plan.popular ? 'border-primary ring-2 ring-primary' : ''}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="text-4xl font-bold">
                                {plan.price.startsWith('Contact') ? plan.price : `$${plan.price}`}
                                { !plan.price.startsWith('Contact') && <span className="text-lg font-normal text-muted-foreground">/mo</span> }
                            </div>
                            <ul className="space-y-2">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>{plan.cta}</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
      </main>
      <footer className="p-4 md:p-6 mt-16">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Built with Next.js and ShadCN.
          </p>
        </div>
      </footer>
    </div>
  );
}
