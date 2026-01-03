import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SiWhatsapp } from "react-icons/si";

export default function Contact() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "We'll get back to you within 24 hours",
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+91 85275 30910"],
      action: "tel:+918527530910"
    },
    {
      icon: Mail,
      title: "Email",
      details: ["acharyaomshah@gmail.com"],
      action: "mailto:acharyaomshah@gmail.com"
    },
    {
      icon: MapPin,
      title: "Address",
      details: ["133 D, India Expo Plaza", "Knowledge Park II Metro", "Greater Noida, 201310"],
      action: null
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Sunday - Saturday: 11:00 AM - 08:00 PM"],
      action: null
    }
  ];

  return (
    <>
      <Head>
        <title>Contact Us - Divine Astrology</title>
      </Head>
      <div className="min-h-screen bg-background">
        <div className="vedic-header py-16">
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              We're here to answer your questions and guide you on your spiritual journey
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Send Us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" type="tel" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input id="subject" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        required
                        rows={6}
                        placeholder="How can we help you?"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-2">{info.title}</h3>
                        {info.details.map((detail, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <SiWhatsapp className="h-5 w-5 mr-2" />
                Chat on WhatsApp
              </Button>
            </div>
          </div>

          <div className="mt-12">
            <Card>
              <CardContent className="p-0">
                <div className="w-full h-96 bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src="https://maps.google.com/maps?q=133%20D%2C%20India%20Expo%20Plaza%2C%20Knowledge%20Park%20II%20Metro%2C%20Greater%20Noida%2C%20201310&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    title="Divine Astrology Location"
                  ></iframe>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
