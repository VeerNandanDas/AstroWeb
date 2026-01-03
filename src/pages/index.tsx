import Link from "next/link";
import Head from "next/head";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Award, TrendingUp, CheckCircle2, ArrowRight, Zap, Sunrise, Clock, Sun, Moon, Settings, ShoppingBag, Home as HomeIcon, XCircle } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import { TestimonialsSlider } from "@/components/TestimonialsSlider";
import { BlogSection } from "@/components/BlogSection";
import { FAQSection } from "@/components/FAQSection";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, Play, ExternalLink, GraduationCap, Microscope, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function Home() {
  // Zodiac sign metadata (symbols and colors)
  const zodiacMeta: Record<string, { symbol: string; color: string }> = {
    aries: { symbol: "♈", color: "from-red-500 to-orange-500" },
    taurus: { symbol: "♉", color: "from-green-600 to-emerald-500" },
    gemini: { symbol: "♊", color: "from-yellow-500 to-amber-500" },
    cancer: { symbol: "♋", color: "from-blue-600 to-cyan-500" },
    leo: { symbol: "♌", color: "from-orange-500 to-red-500" },
    virgo: { symbol: "♍", color: "from-emerald-600 to-teal-500" },
    libra: { symbol: "♎", color: "from-pink-500 to-rose-500" },
    scorpio: { symbol: "♏", color: "from-purple-600 to-indigo-500" },
    sagittarius: { symbol: "♐", color: "from-violet-600 to-purple-500" },
    capricorn: { symbol: "♑", color: "from-slate-600 to-gray-600" },
    aquarius: { symbol: "♒", color: "from-cyan-500 to-blue-500" },
    pisces: { symbol: "♓", color: "from-teal-500 to-green-500" },
  };

  // State for horoscope data
  const [horoscope, setHoroscope] = useState<Array<{ sign: string; prediction: string; symbol: string; color: string }>>([]);
  const [isLoadingHoroscope, setIsLoadingHoroscope] = useState(true);

  // Fetch horoscope data from API
  useEffect(() => {
    const fetchHoroscopes = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const response = await fetch(`/api/horoscope?date=${today}`);

        if (response.ok) {
          const data = await response.json();

          // Transform API data to match component format
          const formattedHoroscopes = data.map((item: any) => ({
            sign: item.sign.charAt(0).toUpperCase() + item.sign.slice(1), // Capitalize
            prediction: item.love || "Check back later for your daily prediction.",
            symbol: zodiacMeta[item.sign.toLowerCase()]?.symbol || "⭐",
            color: zodiacMeta[item.sign.toLowerCase()]?.color || "from-purple-500 to-pink-500"
          }));

          setHoroscope(formattedHoroscopes);
        } else {
          // Fallback to default message if no data
          setHoroscope(Object.keys(zodiacMeta).map(sign => ({
            sign: sign.charAt(0).toUpperCase() + sign.slice(1),
            prediction: "Check back later for your daily prediction.",
            symbol: zodiacMeta[sign].symbol,
            color: zodiacMeta[sign].color
          })));
        }
      } catch (error) {
        console.error("Error fetching horoscopes:", error);
        // Fallback to default message on error
        setHoroscope(Object.keys(zodiacMeta).map(sign => ({
          sign: sign.charAt(0).toUpperCase() + sign.slice(1),
          prediction: "Check back later for your daily prediction.",
          symbol: zodiacMeta[sign].symbol,
          color: zodiacMeta[sign].color
        })));
      } finally {
        setIsLoadingHoroscope(false);
      }
    };

    fetchHoroscopes();
  }, []);

  // State for muhurat data
  const [muhurat, setMuhurat] = useState<any>(null);
  const [isLoadingMuhurat, setIsLoadingMuhurat] = useState(true);

  // Fetch monthly muhurat data from API
  useEffect(() => {
    const fetchMuhurat = async () => {
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const currentMonth = `${year}-${month}`; // YYYY-MM
        const response = await fetch(`/api/muhurat?month=${currentMonth}`);

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setMuhurat(data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching muhurat:", error);
      } finally {
        setIsLoadingMuhurat(false);
      }
    };

    fetchMuhurat();
  }, []);

  // State for panchang data
  const [panchang, setPanchang] = useState<any>(null);
  const [isLoadingPanchang, setIsLoadingPanchang] = useState(true);

  // Fetch daily panchang data from API
  useEffect(() => {
    const fetchPanchang = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/panchang?date=${today}`);

        if (response.ok) {
          const data = await response.json();
          setPanchang(data);
        }
      } catch (error) {
        console.error("Error fetching panchang:", error);
      } finally {
        setIsLoadingPanchang(false);
      }
    };
    fetchPanchang();
  }, []);

  // State for videos
  const { data: videos, isLoading: isLoadingVideos } = useQuery<any[]>({
    queryKey: ["/api/videos"],
    queryFn: async () => {
      const response = await fetch("/api/videos");
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    }
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const credentials = [
    { image: "/gold medal.jpeg", title: "Gold Medalist", subtitle: "Jyotish Aacharya", colSpan: "lg:row-span-2" },
    { image: "/award.jpeg", title: "Excellence Award", subtitle: "Best Astrologer 2023", colSpan: "lg:row-span-2" },
    { image: "/result.jpeg", title: "Outstanding Result", subtitle: "Proven Track Record", colSpan: "lg:row-span-1" },
    { image: "/degree.jpeg", title: "Certified Degree", subtitle: "M.A (Astrology)", colSpan: "lg:row-span-1" },
  ];


  // Booking state
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState("");

  const services = [
    {
      id: "horoscope-analysis",
      name: "Horoscope Analysis",
      description: "A comprehensive analysis of your birth chart to provide insights into your personality, health, relationships, marriage, career, and financial gains etc.",
      price: "₹3,000 + 18% GST"
    },
    {
      id: "varshaphala",
      name: "Varshaphala (Annual Forecast)",
      description: "Detailed astrological guidance for one full year. This analysis utilizes your Janma Kundali  (parashari and jaimini systems) combined with your Varsha Kundali to predict yearly trends.",
      price: "₹6,000 + 18% GST"
    },
    {
      id: "muhurta-selection",
      name: "Muhurta Selection",
      description: "Identification of the most auspicious moments for significant life events, including marriage, travel, Griha Pravesh, and business inaugurations.",
      price: "₹6,000 + 18% GST"
    },
    {
      id: "residential-Vaastu",
      name: "Residential Vaastu Analysis",
      description: "A detailed Vaastu report for your home with effective remedies to optimize energy flow, ensuring peace and prosperity.",
      price: "₹20 / sq. ft.+  18% GST"
    },
    {
      id: "commercial-Vaastu",
      name: "Commercial Vaastu Analysis",
      description: "Specialized Vaastu assessment for offices, shops, or factories to identify remedies that remove obstacles and stimulate business growth.",
      price: "₹20 / sq. ft + 18% GST."
    },
    {
      id: "karmic-remedial",
      name: "Astrological (Karmic) Remedial Services",
      description: " Vedic remedies includes Vaastu remedies , garha anusthaan(mantra , hawan ), panch tatwa treatment and yantra therapy",
      price: "₹20,000 + 18% GST"
    }
  ];

  const timeSlots = ["11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"];

  const handleBookingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!consultationType) {
      toast({
        title: "Selection Required",
        description: "Please select a consultation service first.",
        variant: "destructive"
      });
      return;
    }

    const name = (form.querySelector("#name") as HTMLInputElement)?.value;
    const phone = (form.querySelector("#phone") as HTMLInputElement)?.value;
    const birthDetails = (form.querySelector("#birth-details") as HTMLInputElement)?.value;
    const birthPlace = (form.querySelector("#birth-place") as HTMLInputElement)?.value;
    const message = (form.querySelector("#message") as HTMLTextAreaElement)?.value;

    const whatsappMessage = `Hello Aacharya Om shah,%0A%0AI would like to book a *${consultationType}* consultation.%0A%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Birth Details:* ${birthDetails}%0A*Birth Place:* ${birthPlace}%0A*Preferred Date:* ${bookingDate?.toLocaleDateString()}%0A*Preferred Time:* ${selectedTime}%0A%0A*Additional Message:* ${message || "N/A"}`;
    const adminPhoneNumber = "918527530910";
    window.open(`https://wa.me/${adminPhoneNumber}?text=${whatsappMessage}`, "_blank");
  };


  const features = [
    {
      icon: Shield,
      title: "100% Authentic",
      description: "All products certified and verified by expert Astrologers"
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
      name: "Healing Crystals",
      href: "/products/healing-crystals",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop",
      description: "Powerful healing crystals"
    },
    {
      name: "Rudrakshas",
      href: "/products/rudrakshas",
      image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop",
      description: "Sacred Rudraksha beads"
    },
    {
      name: "Vaastu Products",
      href: "/products/Vaastu",
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
      description: "Energy balancing Vaastu tools"
    },
    {
      name: "Others",
      href: "/products/others",
      image: "/astro-remedies-for-all-sun-signs-2025-1733308932583.jpg",
      description: "Other spiritual items"
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

  return (
    <>
      <Head>
        <title>Vedic Intution - Premium Gemstones, Spiritual Guidance & Authentic Remedies</title>
      </Head>
      <div className="min-h-screen">
        {/* 1. Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/95 via-blue-950/90 to-slate-950/95"></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 max-w-4xl mx-auto leading-tight"
            >
              Decode Your <span className="text-accent">Prārabdha</span> to <br />
              Engineer Your <span className="text-accent">Karma</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Expert Vedic Astrology & Vaastu Consultation through scientific remedies to guide your journey to holistic prosperity!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/products">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 min-w-[200px]">
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/book-appointment">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 min-w-[200px]">
                  Book Consultation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* 2. About & Excellence Section */}
        <section className="py-24 bg-background overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative flex justify-center order-2 lg:order-1"
              >
                <div
                  className="max-w-md w-full aspect-[4/5] rounded-2xl overflow-hidden border-8 border-muted shadow-2xl relative cursor-pointer group"
                  onClick={() => setSelectedImage("/WhatsApp Image 2026-01-03 at 17.07.18.jpeg")}
                >
                  <img src="/WhatsApp Image 2026-01-03 at 17.07.18.jpeg" alt="Aacharya Om shah" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500"></div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="order-1 lg:order-2"
              >
                <Badge className="bg-accent/10 text-accent mb-6 px-4 py-1.5 uppercase tracking-wider font-semibold">Vedic Astrologer & Vaastu consultant</Badge>
                <h2 className="font-serif text-5xl md:text-6xl font-bold mb-8 leading-tight">
                  Aacharya <span className="text-accent italic">Om shah</span>
                </h2>

                <div className="space-y-8 text-lg text-muted-foreground leading-relaxed">
                  <p className="border-l-4 border-accent/30 pl-6 py-2">
                    <span className="font-bold text-foreground">Aacharya Om shah</span> is a <span className="text-[#D4AF37] font-extrabold underline decoration-accent/20">Gold medalist</span> Astrologer from K.N.Rao Institute of Astrology, Bharati Vidya Bhavan, New Delhi.
                  </p>

                  <p>
                    He holds <span className="text-foreground font-medium">M.A. (Astrology)</span> and <b>Diploma</b> in <span className="text-foreground font-medium">(Vaastu Shastra)</span> and <span className="text-foreground font-medium">(Medical Astrology)</span> from BVB Delhi and SLBS National Sanskrit University, respectively.
                    Aacharya shah is an ex-microbiologist , <b>M.Sc. (Microbiology)</b> and <b>Pre-PhD (Molecular Medicine).</b> <br />
                    <br></br> With Over 6 years of experience in Vedic Astrology and Vaastu Shastra, he brings remarkable changes in one's life using his astrological predictions, Vaastu, and karmic remedies.
                  </p>


                </div>
              </motion.div>
            </div>

            {/* Photo Credentials Gallery */}
            <div className="mb-32">
              <div className="text-center mb-16">
                <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">Excellence</span>
                <h3 className="font-serif text-4xl font-bold mb-4">Academic Excellence & Recognition</h3>
                <div className="w-24 h-1 bg-accent mx-auto"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[280px]">
                {credentials.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`relative group overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer ${item.colSpan || ""}`}
                    onClick={() => setSelectedImage(item.image)}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h4 className="text-white font-serif text-2xl font-bold mb-1">{item.title}</h4>
                        <p className="text-white/80 text-sm tracking-wide font-light">{item.subtitle}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* 3. Book Consultation Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">Book Your Consultation</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Get personalized astrology guidance from our expert Astrologers</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="relative mb-2">
                      <Avatar className="w-32 h-32 mx-auto border-4 border-accent/20">
                        <AvatarImage src="/WhatsApp Image 2026-01-03 at 17.07.18.jpeg" className="object-cover" />
                        <AvatarFallback>AOS</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold">Aacharya Om shah</h3>
                      <p className="text-accent font-medium text-sm">Astro & Vaastu Consultant</p>
                      <p className="text-muted-foreground text-xs italic">(Karmic Consultant)</p>
                    </div>

                    <div className="space-y-3 text-[11px] text-muted-foreground border-t pt-4 text-left">
                      <p className="flex items-start gap-2">
                        <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase">Aacharya</Badge>
                        <span>Jyotish, BVB-Delhi (Gold Medal)</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase">Diploma</Badge>
                        <span>Medical Astrology, Vaastu Shastra & Palmistry</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase">Academic</Badge>
                        <span>M.A.(Astrology) <br></br> M.Sc.(Microbiology), Pre-PhD (Molecular Medicine)</span>
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Consultation Fee</p>
                      <div className="font-bold text-accent text-2xl">
                        {services.find(s => s.name === consultationType)?.price || "Select Service"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-8">
                    <form onSubmit={handleBookingSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input id="name" placeholder="Your Name" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input id="phone" placeholder="Your Phone" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Date & Time of Birth</Label>
                          <Input id="birth-details" placeholder="15 Aug 1990, 10:30 AM" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Place of Birth</Label>
                          <Input id="birth-place" placeholder="City, State, Country" required />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Select Service</Label>
                        <div className="grid grid-cols-1 gap-3">
                          {services.map((service) => (
                            <div
                              key={service.id}
                              onClick={() => setConsultationType(service.name)}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${consultationType === service.name ? "border-accent bg-accent/5" : "border-border"
                                }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold">{service.name}</h4>
                                <span className="text-accent font-bold">{service.price}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Select Date</Label>
                          <div className="border rounded-md p-2 flex justify-center bg-background">
                            <Calendar
                              mode="single"
                              selected={bookingDate}
                              onSelect={setBookingDate}
                              disabled={(d) => d < new Date() || d.getDay() === 0}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label>Select Time</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {timeSlots.map((time) => {
                              const isUnavailable = ["11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"].includes(time);
                              return (
                                <Button
                                  key={time}
                                  type="button"
                                  variant={selectedTime === time ? "default" : "outline"}
                                  onClick={() => !isUnavailable && setSelectedTime(time)}
                                  disabled={isUnavailable}
                                  className={`text-xs relative ${isUnavailable ? "opacity-60 bg-muted cursor-not-allowed border-dashed" : ""}`}
                                >
                                  {time}
                                  {isUnavailable && (
                                    <span className="absolute -top-2 -right-1 bg-destructive text-[8px] text-white px-2 rounded-full uppercase">Unavailable</span>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                          <div className="space-y-2">
                            <Label>Additional Message</Label>
                            <Textarea id="message" placeholder="Optional questions..." rows={3} />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90">
                        Book via WhatsApp
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Products Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">Purchase Authentic Products</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Sourced and certified by experts for your spiritual growth</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {categories.map((category, index) => (
                <Link key={index} href={category.href}>
                  <motion.div
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-lg">{category.name}</h3>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Blogs Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl font-bold mb-4">Vedic Intuition Blogs</h2>
              <p className="text-muted-foreground text-lg">Knowledge and wisdom for your modern lifestyle</p>
            </div>
            <BlogSection limit={3} />
            <div className="text-center mt-12">
              <Link href="/blog">
                <Button variant="outline" size="lg">View All Blogs</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 6. Videos Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">Vedic Intuition Videos</h2>
              <p className="text-muted-foreground text-lg">Watch guidances and insights from Aacharya Om Shah</p>
            </div>

            {isLoadingVideos ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="aspect-video bg-muted rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {videos?.slice(0, 3).map((video: any) => (
                  <motion.div key={video.id} whileHover={{ scale: 1.02 }} className="group">
                    <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl mb-4">
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white shadow-2xl">
                            <Play className="fill-current w-6 h-6 ml-1" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-serif text-xl font-bold line-clamp-2">{video.title}</h3>
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
            <div className="text-center mt-12">
              <Link href="/videos">
                <Button variant="outline" size="lg">See More Videos</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Daily Horoscope Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Zap className="text-accent h-8 w-8" />
                <h2 className="font-serif text-4xl font-bold">Daily Horoscope</h2>
                <Zap className="text-accent h-8 w-8" />
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Discover what the stars have in store for you today</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {horoscope.map((item, index) => (
                <Card key={index} className="transition-all hover:border-accent hover:shadow-lg group">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-4xl shadow-xl transform transition-transform group-hover:scale-110`}>
                        {item.symbol}
                      </div>
                      <div>
                        <h4 className="font-bold text-accent text-xl mb-2">{item.sign}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">{item.prediction}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Today's Panchang Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Clock className="text-accent h-8 w-8" />
                <h2 className="font-serif text-4xl font-bold">Today's Panchang</h2>
                <Clock className="text-accent h-8 w-8" />
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {panchang ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {[
                  { l: "Tithi", v: panchang.tithi, s: "तिथि" },
                  { l: "Vaar", v: panchang.vaar, s: "वार" },
                  { l: "Nakshatra", v: panchang.nakshatr, s: "नक्षत्र" },
                  { l: "Yoga", v: panchang.yoga, s: "योग" }
                ].map((x, i) => (
                  <Card key={i} className="bg-muted/20 border-accent/10">
                    <CardContent className="p-8 text-center">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{x.l}</p>
                      <p className="font-serif text-2xl font-bold text-accent mb-1">{x.v || "—"}</p>
                      <p className="text-[10px] text-muted-foreground opacity-60">{x.s}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-muted/20 rounded-2xl max-w-2xl mx-auto">
                <p className="text-muted-foreground">Panchang data not available for today.</p>
              </div>
            )}
          </div>
        </section>

        {/* 9. Auspicious Muhurat Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sunrise className="text-accent h-8 w-8" />
                <h2 className="font-serif text-4xl font-bold">Auspicious Muhurat</h2>
                <Sunrise className="text-accent h-8 w-8" />
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Plan your auspicious beginnings with divine timing</p>
            </div>

            {muhurat ? (
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-background">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent/10 rounded-xl text-accent">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1">General Auspicious Days</p>
                        <p className="text-lg font-medium leading-relaxed">{muhurat.auspiciousDays}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {muhurat.newHome && (
                  <Card className="bg-background">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-accent/10 rounded-xl text-accent">
                          <HomeIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1">Griha Pravesh (New Home)</p>
                          <p className="text-lg font-medium leading-relaxed">{muhurat.newHome}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {muhurat.vehiclePurchase && (
                  <Card className="bg-background md:col-span-2">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-accent/10 rounded-xl text-accent">
                          <Settings className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1">Vehicle Purchase</p>
                          <p className="text-lg font-medium leading-relaxed">{muhurat.vehiclePurchase}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center p-12 bg-background/50 rounded-2xl max-w-2xl mx-auto border border-dashed border-muted-foreground/30">
                <p className="text-muted-foreground">No auspicious muhurats listed for this month.</p>
              </div>
            )}
          </div>
        </section>

        {/* 10. Contact Us Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-6xl mx-auto shadow-2xl rounded-3xl overflow-hidden bg-muted/10 border border-muted flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-12 bg-primary text-primary-foreground space-y-8">
                <div>
                  <h2 className="font-serif text-4xl font-bold mb-4">Get in Touch</h2>
                  <p className="text-primary-foreground/80 leading-relaxed">
                    We're here to answer your questions and guide you on your spiritual journey. Reach out to us through any channel.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Phone</p>
                      <p className="font-bold">+91 85275 30910</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Email</p>
                      <p className="font-bold">acharyaomshah@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Address</p>
                      <p className="font-bold">Greater Noida, India</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <a href="https://wa.me/918527530910" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <SiWhatsapp className="w-5 h-5 mr-3" />
                      Chat on WhatsApp
                    </Button>
                  </a>
                </div>
              </div>

              <div className="lg:w-1/2 p-12 bg-background">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="c-name">Full Name</Label>
                    <Input id="c-name" placeholder="Your Name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-email">Email Address</Label>
                    <Input id="c-email" type="email" placeholder="Your Email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-message">How can we help you?</Label>
                    <Textarea id="c-message" placeholder="Your message here..." rows={6} />
                  </div>
                  <Button className="w-full" size="lg">Send Message</Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-3xl font-bold mb-4">
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
      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl p-0 bg-transparent border-none shadow-none text-white overflow-hidden flex items-center justify-center">
          <div className="relative w-full h-[80vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Close image"
            >
              <X className="w-8 h-8" />
            </button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full view"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
