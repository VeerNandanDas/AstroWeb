import Link from "next/link";
import Head from "next/head";
import { Card, CardContent } from "@/components/ui/card";

export default function Horoscope() {
  const zodiacSigns = [
    { name: "Aries", symbol: "♈", dates: "Mar 21 - Apr 19", element: "Fire", slug: "aries" },
    { name: "Taurus", symbol: "♉", dates: "Apr 20 - May 20", element: "Earth", slug: "taurus" },
    { name: "Gemini", symbol: "♊", dates: "May 21 - Jun 20", element: "Air", slug: "gemini" },
    { name: "Cancer", symbol: "♋", dates: "Jun 21 - Jul 22", element: "Water", slug: "cancer" },
    { name: "Leo", symbol: "♌", dates: "Jul 23 - Aug 22", element: "Fire", slug: "leo" },
    { name: "Virgo", symbol: "♍", dates: "Aug 23 - Sep 22", element: "Earth", slug: "virgo" },
    { name: "Libra", symbol: "♎", dates: "Sep 23 - Oct 22", element: "Air", slug: "libra" },
    { name: "Scorpio", symbol: "♏", dates: "Oct 23 - Nov 21", element: "Water", slug: "scorpio" },
    { name: "Sagittarius", symbol: "♐", dates: "Nov 22 - Dec 21", element: "Fire", slug: "sagittarius" },
    { name: "Capricorn", symbol: "♑", dates: "Dec 22 - Jan 19", element: "Earth", slug: "capricorn" },
    { name: "Aquarius", symbol: "♒", dates: "Jan 20 - Feb 18", element: "Air", slug: "aquarius" },
    { name: "Pisces", symbol: "♓", dates: "Feb 19 - Mar 20", element: "Water", slug: "pisces" }
  ];

  return (
    <>
      <Head>
        <title>Daily Horoscope - Divine Astrology</title>
      </Head>
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Daily Horoscope
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
              Discover what the stars have in store for you today
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {zodiacSigns.map((sign) => (
              <Link key={sign.slug} href={`/horoscope/${sign.slug}`}>
                <Card className="hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="text-5xl text-accent group-hover:scale-110 transition-transform">
                      {sign.symbol}
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold mb-1">
                        {sign.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{sign.dates}</p>
                      <p className="text-xs text-accent mt-1">{sign.element}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
