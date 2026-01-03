import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Award, Calendar as CalendarIcon, MapPin, Video, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { getAuthToken } from "@/lib/supabase";

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  consultationType: string;
  message?: string;
  status: string;
  createdAt?: string;
}

export default function BookAppointment() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState("Personal");
  const [isBooking, setIsBooking] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const services = [
    {
      id: "horoscope-analysis",
      name: "Horoscope Analysis",
      description: "Comprehensive analysis of your birth chart to provide insights into your personality, career, relationships, and future trends.",
      price: "INR 3100",
      category: "horoscope"
    },
    {
      id: "vaastu-consultation",
      name: "Vaastu Consultation",
      description: "Expert guidance on Vaastu Shastra principles for your home or office to harmonize energy and ensure prosperity.",
      price: "INR 5100",
      category: "vastu"
    },
    {
      id: "varsha-kundali",
      name: "Varsha Kundali Analysis",
      description: "Annual horoscope prediction based on your solar return chart, covering the year from one birthday to the next.",
      price: "INR 6100",
      category: "horoscope"
    },
    {
      id: "birth-time-rectification",
      name: "Birth Time Rectification",
      description: "Precise calculation to correct your recorded birth time by matching life events with astrological timing.",
      price: "INR 4100",
      category: "birthtime"
    }
  ];

  useEffect(() => {
    const service = router.query.service as string;
    if (service) {
      setSelectedService(service);
      const foundService = services.find(s => s.id === service);
      if (foundService) {
        setConsultationType(foundService.name);
      }
    } else {
      setSelectedService(null);
    }
  }, [router.query.service]);

  const timeSlots = [
    "10:00 AM", "11:00 AM", "12:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  const { data: appointments = [], isLoading: appointmentsLoading, refetch } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) return [];
      const response = await fetch("/api/appointments", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isAdmin && !authLoading
  });

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    setUpdatingId(appointmentId);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: "Success",
        description: `Appointment ${newStatus} successfully`
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status"
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const startMeeting = (appointmentId: string, customerName: string) => {
    const roomId = appointmentId.substring(0, 21).replace(/-/g, "").toLowerCase();
    const meetingUrl = `https://meet.google.com/${roomId}`;
    window.open(meetingUrl, "_blank");
    toast({
      title: "Google Meet Opened",
      description: `Share this link with the customer: ${meetingUrl}`
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const name = (form.querySelector("#name") as HTMLInputElement)?.value;
    const phone = (form.querySelector("#phone") as HTMLInputElement)?.value; // Fixed: using phone instead of email for whatsapp if needed, but message goes to admin phone.
    const message = (form.querySelector("#message") as HTMLTextAreaElement)?.value;

    // Construct WhatsApp message
    const whatsappMessage = `Hello Acharya Om Shah,%0A%0AI would like to book a *${consultationType}* consultation.%0A%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Preferred Date:* ${date?.toLocaleDateString()}%0A*Preferred Time:* ${selectedTime}%0A%0A*Additional Message:* ${message || "N/A"}`;

    const adminPhoneNumber = "918527530910";
    const whatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${whatsappMessage}`;

    window.open(whatsappUrl, "_blank");

    toast({
      title: "Redirecting to WhatsApp",
      description: "Please send the message to complete your booking."
    });
  };

  if (isAdmin && !authLoading) {
    return (
      <>
        <Head>
          <title>Consultation Bookings - Divine Astrology</title>
        </Head>
        <div className="min-h-screen bg-background">
          <div className="bg-primary text-primary-foreground py-16">
            <div className="container mx-auto px-4 lg:px-8 text-center">
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Consultation Bookings</h1>
              <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">Manage all customer consultation bookings</p>
            </div>
          </div>

          <div className="container mx-auto px-4 lg:px-8 py-12">
            {appointmentsLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Loading bookings...</p>
                </CardContent>
              </Card>
            ) : appointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No consultation bookings yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {Array.isArray(appointments) && appointments.map((appointment) => (
                  <Card key={appointment.id} className="hover-elevate">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-semibold">{appointment.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-semibold text-sm">{appointment.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-semibold">{appointment.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <Badge>{appointment.consultationType}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><CalendarIcon className="w-4 h-4" />Date</p>
                          <p className="font-semibold">{appointment.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4" />Time</p>
                          <p className="font-semibold">{appointment.time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge
                            variant={
                              appointment.status === "accepted" ? "default" :
                                appointment.status === "declined" ? "destructive" :
                                  appointment.status === "completed" ? "secondary" :
                                    "outline"
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Booked</p>
                          <p className="font-semibold text-sm">
                            {appointment.createdAt ? new Date(appointment.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      {appointment.message && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">Message</p>
                          <p className="text-sm">{appointment.message}</p>
                        </div>
                      )}

                      {appointment.status === "pending" && (
                        <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateAppointmentStatus(appointment.id, "accepted")}
                            disabled={updatingId === appointment.id}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateAppointmentStatus(appointment.id, "declined")}
                            disabled={updatingId === appointment.id}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      )}

                      {appointment.status === "accepted" && (
                        <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => startMeeting(appointment.id, appointment.name)}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Start Video Meeting
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                            disabled={updatingId === appointment.id}
                          >
                            Mark Complete
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Book Your Consultation - Divine Astrology</title>
      </Head>
      <div className="min-h-screen bg-background">
        <div className="vedic-header py-16">
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-white">
              Book Your Consultation
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Get personalized astrology guidance from our expert astrologers
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src="/file.png" alt="Acharya Om Shah Kashyap" />
                      <AvatarFallback>AOS</AvatarFallback>
                    </Avatar>
                    <h3 className="font-serif text-2xl font-bold mb-2">
                      ACHARYA OM SHAH KASHYAP
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Jyotish Acharya (Gold Medal)<br />
                      Bhartiya Vidya Bhawan<br />
                      M.A. Astrology, UOU, Uttarakhand<br />
                      Medical Astrology (Diploma), SLBSNSU<br />
                      Vaastu Shastra (Diploma), BVB–Delhi
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-accent fill-accent" />
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">(500+ consultations)</span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Address</p>
                        <p className="text-xs text-muted-foreground">133 D, India Expo Plaza<br />Knowledge Park II Metro<br />Greater Noida, 201310</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Email</p>
                        <p className="text-xs text-muted-foreground break-all">acharyaomshah@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Phone</p>
                        <p className="text-xs text-muted-foreground">+91 85275 30910</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Consultation Fee</p>
                      <p className="text-xl font-bold text-accent">
                        {services.find(s => s.name === consultationType)?.price || "Select Service"}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <img
                        src="/payment.jpeg"
                        alt="Payment Methods"
                        className="w-full h-auto rounded-md shadow-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Appointment Details</CardTitle>
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
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" type="tel" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth *</Label>
                        <Input id="dob" type="date" required />
                      </div>
                    </div>

                    {selectedService ? (
                      <div className="space-y-3 p-4 rounded-lg border-2 border-accent bg-accent/10">
                        {services.filter(s => s.id === selectedService).map((service) => (
                          <div key={service.id}>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className="font-semibold">{service.name}</h3>
                              <span className="text-accent font-bold text-lg">{service.price}</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label>Select Service *</Label>
                        <div className="space-y-3">
                          {services.map((service) => (
                            <div
                              key={service.id}
                              onClick={() => setConsultationType(service.name)}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover-elevate ${consultationType === service.name
                                ? "border-accent bg-accent/10"
                                : "border-border bg-background"
                                }`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h3 className="font-semibold text-sm leading-tight flex-1">{service.name}</h3>
                                <span className="text-accent font-bold text-sm whitespace-nowrap">{service.price}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Select Date</Label>
                      <div className="border rounded-md p-4 flex justify-center">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(d) => d < new Date() || d.getDay() === 0}
                          className="rounded-md"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Time Slot *</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? "default" : "outline"}
                            onClick={() => setSelectedTime(time)}
                            className="w-full"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Any specific questions or concerns..."
                        rows={4}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isBooking}
                    >
                      Book via WhatsApp
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
