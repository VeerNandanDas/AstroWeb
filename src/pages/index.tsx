import Link from "next/link";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Award, TrendingUp, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import { TestimonialsSlider } from "@/components/TestimonialsSlider";
import { BlogSection } from "@/components/BlogSection";
import { FAQSection } from "@/components/FAQSection";

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: "100% Authentic",
      description: "All products certified and verified by expert astrologers"
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Sourced from trusted suppliers with quality assurance"
    },
    {
      icon: TrendingUp,
      title: "Proven Results",
      description: "Thousands of satisfied customers with life transformations"
    }
  ];

  const categories = [
    {
      name: "Gemstones",
      href: "/products/gemstones",
      image: "https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400&h=300&fit=crop",
      description: "Natural certified gemstones"
    },
    {
      name: "Bracelets",
      href: "/products/bracelets",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop",
      description: "Healing crystal bracelets"
    },
    {
      name: "Rudraksha",
      href: "/products/rudraksha",
      image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop",
      description: "Sacred Rudraksha beads"
    },
    {
      name: "Yantras",
      href: "/products/yantras",
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
      description: "Powerful sacred yantras"
    },
    {
      name: "Rings",
      href: "/products/rings",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=300&fit=crop",
      description: "Astrological gemstone rings"
    },
    {
      name: "Remedies",
      href: "/products/remedies",
      image: "/astro-remedies-for-all-sun-signs-2025-1733308932583.jpg",
      description: "Spiritual remedy products"
    }
  ];

  const benefits = [
    "Expert astrology consultations",
    "Certified authentic products",
    "Personalized recommendations",
    "Secure online payments",
    "Fast & safe delivery",
    "100% satisfaction guarantee"
  ];

  const horoscope = [
    { sign: "Aries", prediction: "Financial gain, happiness from vehicle & beloved.", symbol: "♈", color: "from-red-500 to-orange-500" },
    { sign: "Taurus", prediction: "Cure from disease, money gain, good fortune.", symbol: "♉", color: "from-green-600 to-emerald-500" },
    { sign: "Gemini", prediction: "Disturbance, loss, attachment, health issues.", symbol: "♊", color: "from-yellow-500 to-amber-500" },
    { sign: "Cancer", prediction: "Fear, quarrel, restlessness, loss, tough time.", symbol: "♋", color: "from-blue-600 to-cyan-500" },
    { sign: "Leo", prediction: "Victory, money gain, happiness, good health.", symbol: "♌", color: "from-orange-500 to-red-500" },
    { sign: "Virgo", prediction: "Financial loss, dissatisfaction, tough fortune.", symbol: "♍", color: "from-emerald-600 to-teal-500" },
    { sign: "Libra", prediction: "Fortune rise, good health, happiness, honor.", symbol: "♎", color: "from-pink-500 to-rose-500" },
    { sign: "Scorpio", prediction: "Mental/physical pain, loss of money & respect.", symbol: "♏", color: "from-purple-600 to-indigo-500" },
    { sign: "Sagittarius", prediction: "Money gain, happiness, good health.", symbol: "♐", color: "from-violet-600 to-purple-500" },
    { sign: "Capricorn", prediction: "Work accomplished, good health, fortune.", symbol: "♑", color: "from-slate-600 to-gray-600" },
    { sign: "Aquarius", prediction: "Disease, fear, loss in work, argument.", symbol: "♒", color: "from-cyan-500 to-blue-500" },
    { sign: "Pisces", prediction: "Health issues, fear, quarrel, worry, tough time.", symbol: "♓", color: "from-teal-500 to-green-500" },
  ];

  return (
    <>
      <Head>
        <title>Divine Astrology - Premium Gemstones, Spiritual Guidance & Authentic Remedies</title>
      </Head>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 w-full h-full">
            <video
              className="absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/videoplayback.mp4" type="video/mp4" />
            </video>
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-violet-900/70 to-purple-900/85"></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
            <Badge className="mb-6 bg-accent/20 text-accent border-accent/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Trusted by 50,000+ Customers
            </Badge>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 max-w-4xl mx-auto leading-tight">
              Awaken Your Inner{" "}
              <span className="text-accent">ज्योति</span>
              {" "}Guide Your Destiny
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover authentic gemstones, spiritual remedies, and expert astrology consultations to guide your journey to wellness and prosperity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/products">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 min-w-[200px]">
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/book-appointment">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 backdrop-blur-sm min-w-[200px]">
                  Book Consultation
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Smooth Transition Section */}
        <div className="h-32 bg-gradient-to-b from-purple-900/85 via-purple-800/40 to-background"></div>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-background relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* Card 1 - Purple/Lavender */}
              <div className="group perspective-1000">
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-purple-200 to-purple-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 overflow-hidden">
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/40 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-700" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-purple-400/30"></div>
                  <div className="absolute top-1/2 right-8 w-16 h-16">
                    <div className="w-full h-full rounded-full border-4 border-purple-400/40"></div>
                  </div>
                  <div className="relative z-10 mt-12">
                    <h3 className="font-serif text-2xl font-bold mb-3 text-purple-900">100%<br /><span className="italic">Authentic</span></h3>
                    <p className="text-purple-800 text-sm leading-relaxed">All products certified and verified by expert astrologers</p>
                  </div>
                </div>
              </div>
              {/* Card 2 - Deep Purple/Blue */}
              <div className="group perspective-1000">
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:-rotate-1 overflow-hidden">
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute top-8 left-6 w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-white/10"></div>
                    <div className="absolute inset-2 rounded-full bg-white/10"></div>
                    <div className="absolute inset-4 rounded-full bg-white/10"></div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-purple-700/30"></div>
                  <div className="relative z-10 mt-12">
                    <h3 className="font-serif text-2xl font-bold mb-3 text-white">Premium<br /><span className="italic">Quality</span></h3>
                    <p className="text-white/90 text-sm leading-relaxed">Sourced from trusted suppliers with quality assurance</p>
                  </div>
                </div>
              </div>
              {/* Card 3 - Yellow/Orange */}
              <div className="group perspective-1000">
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-amber-200 to-yellow-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 overflow-hidden">
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/40 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-amber-700" />
                  </div>
                  <div className="absolute top-12 left-8">
                    <div className="grid grid-cols-3 gap-1">
                      {[...Array(9)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-amber-400/40"></div>)}
                    </div>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-3xl bg-yellow-400/30 transform rotate-45"></div>
                  <div className="relative z-10 mt-12">
                    <h3 className="font-serif text-2xl font-bold mb-3 text-amber-900">Proven<br /><span className="italic">Results</span></h3>
                    <p className="text-amber-800 text-sm leading-relaxed">Thousands of satisfied customers with life transformations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                Explore Our Collections
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover authentic spiritual products carefully curated for your well-being
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {categories.map((category, index) => (
                <Link key={index} href={category.href}>
                  <Card className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-serif text-2xl font-bold text-white mb-1">{category.name}</h3>
                        <p className="text-white/90 text-sm">{category.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <Sparkles className="h-12 w-12 text-accent mx-auto mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Begin Your Spiritual Journey Today
            </h2>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8">
              Connect with our expert astrologers and discover the perfect remedies for your life path
            </p>
            <Link href="/book-appointment">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Book Your Consultation Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Daily Horoscope Section */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Zap className="h-8 w-8 text-accent" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold">Daily Horoscope</h2>
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover what the stars have in store for you today
              </p>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              {horoscope.map((item, index) => (
                <Card
                  key={index}
                  className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20 hover-elevate active-elevate-2 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-20 h-20 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}>
                        <span className="text-4xl">{item.symbol}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-2xl font-bold text-accent mb-2">{item.sign}</h3>
                        <div className="h-1 w-12 bg-gradient-to-r from-accent to-primary/50 rounded-full mb-4"></div>
                        <p className="text-foreground/80 text-sm leading-relaxed">
                          {item.prediction}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                Why Choose Divine Astrology?
              </h2>
              <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
                We are committed to providing authentic products and genuine guidance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-primary-foreground/90">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                What Our Customers Say
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Real experiences from people who transformed their lives
              </p>
            </div>

            <TestimonialsSlider />
          </div>
        </section>

        {/* Blog Section */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                From Our Blog
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Insights on astrology, gemstones, and spiritual wellness
              </p>
            </div>

            <BlogSection limit={3} />

            <div className="text-center mt-12">
              <Link href="/blog">
                <Button size="lg" variant="outline">
                  Read More Articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-lg">
                Everything you need to know about our products and services
              </p>
            </div>

            <FAQSection />
          </div>
        </section>
      </div>
    </>
  );
}
