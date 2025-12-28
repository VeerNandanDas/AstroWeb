import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanchang() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    });

    const [panchangData, setPanchangData] = useState({
        tithi: "",
        vaar: "",
        nakshatr: "",
        yoga: "",
        karan: ""
    });

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin && selectedDate) {
            fetchPanchang();
        }
    }, [isAdmin, selectedDate]);

    const fetchPanchang = async () => {
        try {
            const response = await fetch(`/api/panchang?date=${selectedDate}`);
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    setPanchangData({
                        tithi: data.tithi || "",
                        vaar: data.vaar || "",
                        nakshatr: data.nakshatr || "",
                        yoga: data.yoga || "",
                        karan: data.karan || ""
                    });
                } else {
                    // Reset form for new date
                    setPanchangData({
                        tithi: "",
                        vaar: "",
                        nakshatr: "",
                        yoga: "",
                        karan: ""
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching panchang:", error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const response = await fetch("/api/panchang", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: selectedDate,
                    ...panchangData
                })
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Panchang saved successfully!",
                });
            } else {
                throw new Error("Failed to save panchang");
            }
        } catch (error) {
            console.error("Error saving panchang:", error);
            toast({
                title: "Error",
                description: "Failed to save panchang. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Manage Panchang - Admin Dashboard</title>
            </Head>

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="bg-primary text-primary-foreground py-8">
                    <div className="container mx-auto px-4 lg:px-8">
                        <Link href="/admin">
                            <Button variant="ghost" className="mb-4 text-primary-foreground hover:bg-primary-foreground/10">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Clock className="h-10 w-10 text-accent" />
                            <div>
                                <h1 className="font-serif text-4xl font-bold">Manage Daily Panchang</h1>
                                <p className="text-primary-foreground/90">Set daily astrological details (Tithi, Nakshatra, etc.)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 lg:px-8 py-8">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Daily Panchang Details</CardTitle>
                            <CardDescription>
                                Enter the astrological details for the selected date
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Date Selection */}
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="max-w-xs"
                                />
                            </div>

                            {/* Panchang Fields */}
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <Label htmlFor="tithi">Tithi (तिथि)</Label>
                                    <Input
                                        id="tithi"
                                        placeholder="e.g., Dashami"
                                        value={panchangData.tithi}
                                        onChange={(e) => setPanchangData({ ...panchangData, tithi: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="vaar">Vaar (वार)</Label>
                                    <Input
                                        id="vaar"
                                        placeholder="e.g., Ravivaar"
                                        value={panchangData.vaar}
                                        onChange={(e) => setPanchangData({ ...panchangData, vaar: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nakshatr">Nakshatra (नक्षत्र)</Label>
                                    <Input
                                        id="nakshatr"
                                        placeholder="e.g., Swati"
                                        value={panchangData.nakshatr}
                                        onChange={(e) => setPanchangData({ ...panchangData, nakshatr: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="yoga">Yoga (योग)</Label>
                                    <Input
                                        id="yoga"
                                        placeholder="e.g., Shiva"
                                        value={panchangData.yoga}
                                        onChange={(e) => setPanchangData({ ...panchangData, yoga: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="karan">Karan (करण)</Label>
                                    <Input
                                        id="karan"
                                        placeholder="e.g., Vishti"
                                        value={panchangData.karan}
                                        onChange={(e) => setPanchangData({ ...panchangData, karan: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    size="lg"
                                    className="w-full sm:w-auto"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? "Saving..." : "Save Daily Panchang"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
