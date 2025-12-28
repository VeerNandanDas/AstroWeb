import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Briefcase, Wallet, TrendingUp } from "lucide-react";

export default function HoroscopeDetail() {
  const router = useRouter();
  const { sign } = router.query;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const zodiacData: Record<string, any> = {
    aries: { name: "Aries", symbol: "♈", dates: "Mar 21 - Apr 19", element: "Fire" },
    taurus: { name: "Taurus", symbol: "♉", dates: "Apr 20 - May 20", element: "Earth" },
    gemini: { name: "Gemini", symbol: "♊", dates: "May 21 - Jun 20", element: "Air" },
    cancer: { name: "Cancer", symbol: "♋", dates: "Jun 21 - Jul 22", element: "Water" },
    leo: { name: "Leo", symbol: "♌", dates: "Jul 23 - Aug 22", element: "Fire" },
    virgo: { name: "Virgo", symbol: "♍", dates: "Aug 23 - Sep 22", element: "Earth" },
    libra: { name: "Libra", symbol: "♎", dates: "Sep 23 - Oct 22", element: "Air" },
    scorpio: { name: "Scorpio", symbol: "♏", dates: "Oct 23 - Nov 21", element: "Water" },
    sagittarius: { name: "Sagittarius", symbol: "♐", dates: "Nov 22 - Dec 21", element: "Fire" },
    capricorn: { name: "Capricorn", symbol: "♑", dates: "Dec 22 - Jan 19", element: "Earth" },
    aquarius: { name: "Aquarius", symbol: "♒", dates: "Jan 20 - Feb 18", element: "Air" },
    pisces: { name: "Pisces", symbol: "♓", dates: "Feb 19 - Mar 20", element: "Water" }
  };

  const signStr = typeof sign === "string" ? sign : "";
  const currentSign = zodiacData[signStr];

  useEffect(() => {
    if (signStr) {
      fetchHoroscope();
    }
  }, [signStr]);

  const fetchHoroscope = async () => {
    setLoading(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/horoscope?date=${date}&sign=${signStr}`);
      const result = await response.json();
      if (result && result.length > 0) {
        setData(result[0]);
      }
    } catch (error) {
      console.error("Failed to fetch horoscope", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentSign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Fallback defaults if no API data
  const defaultPredictions = [
    {
      icon: Heart,
      title: "Love & Relationships",
      content: "Today brings positive energy to your relationships. Singles may encounter someone special, while couples will find deeper connection through meaningful conversations."
    },
    {
      icon: Briefcase,
      title: "Career & Work",
      content: "Your professional life shows promising developments. A project you've been working on may finally get the recognition it deserves. Stay focused and confident."
    },
    {
      icon: Wallet,
      title: "Finance & Money",
      content: "Financial stability is on the horizon. Avoid impulsive purchases today and focus on long-term investments. A small unexpected gain is possible."
    },
    {
      icon: TrendingUp,
      title: "Health & Wellness",
      content: "Your energy levels are high today. It's an excellent time to start a new fitness routine or try meditation. Pay attention to your diet and stay hydrated."
    }
  ];

  const predictions = data ? [
    {
      icon: Heart,
      title: "Love & Relationships",
      content: data.love || "No prediction available."
    },
    {
      icon: Briefcase,
      title: "Career & Work",
      content: data.career || "No prediction available."
    },
    {
      icon: Wallet,
      title: "Finance & Money",
      content: data.finance || "No prediction available."
    },
    {
      icon: TrendingUp,
      title: "Health & Wellness",
      content: data.health || "No prediction available."
    }
  ] : defaultPredictions;

  const luckyInfo = data ? {
    number: data.luckyNumber || "7",
    color: data.luckyColor || "Gold",
    time: data.luckyTime || "3-5 PM",
    gem: data.luckyGem || "Ruby"
  } : {
    number: "7",
    color: "Gold",
    time: "3-5 PM",
    gem: "Ruby"
  };

  return (
    <>
      <Head>
        <title>{currentSign.name} Horoscope - Divine Astrology</title>
      </Head>
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <Link href="/horoscope">
              <Button variant="ghost" size="sm" className="mb-6 text-primary-foreground hover:text-accent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Signs
              </Button>
            </Link>

            <div className="flex items-center gap-6">
              <div className="text-8xl text-accent">{currentSign.symbol}</div>
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold mb-2">
                  {currentSign.name}
                </h1>
                <p className="text-primary-foreground/80 text-lg">{currentSign.dates}</p>
                <Badge className="mt-3 bg-accent/20 text-accent border-accent/30">
                  {currentSign.element} Sign
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold mb-2">
              Today's Prediction - {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </h2>
            <p className="text-muted-foreground">
              {data ? "Expert guidance for your day ahead" : "General overview for " + currentSign.name}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {predictions.map((prediction, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <prediction.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{prediction.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{prediction.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-8">
              <h3 className="font-serif text-2xl font-bold mb-6 text-center">Lucky Elements for Today</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lucky Number</p>
                  <p className="text-2xl font-bold text-accent">{luckyInfo.number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lucky Color</p>
                  <p className="text-2xl font-bold text-accent">{luckyInfo.color}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lucky Time</p>
                  <p className="text-2xl font-bold text-accent">{luckyInfo.time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lucky Gem</p>
                  <p className="text-2xl font-bold text-accent">{luckyInfo.gem}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
