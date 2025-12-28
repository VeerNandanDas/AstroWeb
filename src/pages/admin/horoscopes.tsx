import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getAuthToken } from "@/lib/supabase"; // Helper to get token for API calls
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar, Sparkles } from "lucide-react";

export default function AdminHoroscopes() {
    const router = useRouter();
    const { isAdmin, loading } = useAuth();
    const { toast } = useToast();

    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedSign, setSelectedSign] = useState<string>("aries");
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);

    // Horoscope Data State
    const [formData, setFormData] = useState({
        love: "",
        career: "",
        finance: "",
        health: "",
        luckyNumber: "",
        luckyColor: "",
        luckyTime: "",
        luckyGem: ""
    });

    const zodiacSigns = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin && date && selectedSign) {
            fetchHoroscope();
        }
    }, [date, selectedSign, isAdmin]);

    const fetchHoroscope = async () => {
        setLoadingData(true);
        try {
            const response = await fetch(`/api/horoscope?date=${date}&sign=${selectedSign}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const h = data[0];
                setFormData({
                    love: h.love || "",
                    career: h.career || "",
                    finance: h.finance || "",
                    health: h.health || "",
                    luckyNumber: h.luckyNumber || "",
                    luckyColor: h.luckyColor || "",
                    luckyTime: h.luckyTime || "",
                    luckyGem: h.luckyGem || ""
                });
            } else {
                // Reset form if no data exists
                setFormData({
                    love: "",
                    career: "",
                    finance: "",
                    health: "",
                    luckyNumber: "",
                    luckyColor: "",
                    luckyTime: "",
                    luckyGem: ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch horoscope", error);
            toast({ title: "Error", description: "Failed to load horoscope data", variant: "destructive" });
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getAuthToken();
            const response = await fetch("/api/horoscope", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    date,
                    sign: selectedSign,
                    ...formData
                })
            });

            if (!response.ok) throw new Error("Failed to save");

            toast({ title: "Success", description: "Horoscope updated successfully" });
        } catch (error) {
            console.error("Error saving:", error);
            toast({ title: "Error", description: "Failed to save horoscope", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading || !isAdmin) return <div className="p-8 text-center">Loading...</div>;

    return (
        <>
            <Head>
                <title>Admin - Daily Horoscope</title>
            </Head>
            <div className="min-h-screen bg-muted/20 p-8">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-serif font-bold">Manage Daily Horoscope</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Sidebar / Controls */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Select Date</Label>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Select Zodiac Sign</Label>
                                        <Select value={selectedSign} onValueChange={setSelectedSign}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Sign" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {zodiacSigns.map(sign => (
                                                    <SelectItem key={sign} value={sign.toLowerCase()}>
                                                        {sign}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                <p className="font-semibold mb-1 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" /> Pro Tip
                                </p>
                                You can draft horoscopes for future dates by changing the date selector above.
                            </div>
                        </div>

                        {/* Main Form */}
                        <div className="md:col-span-2">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-xl capitalize flex items-center gap-2">
                                        {selectedSign} Horoscope <span className="text-sm font-normal text-muted-foreground">({date})</span>
                                    </CardTitle>
                                    <Button onClick={handleSave} disabled={saving || loadingData}>
                                        {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {loadingData ? (
                                        <div className="text-center py-12 text-muted-foreground">Loading data...</div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Love & Relationships</Label>
                                                    <Textarea
                                                        name="love"
                                                        value={formData.love}
                                                        onChange={handleChange}
                                                        placeholder="Prediction for love life..."
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Career & Work</Label>
                                                    <Textarea
                                                        name="career"
                                                        value={formData.career}
                                                        onChange={handleChange}
                                                        placeholder="Prediction for professional life..."
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Finance & Money</Label>
                                                    <Textarea
                                                        name="finance"
                                                        value={formData.finance}
                                                        onChange={handleChange}
                                                        placeholder="Prediction for financial matters..."
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Health & Wellness</Label>
                                                    <Textarea
                                                        name="health"
                                                        value={formData.health}
                                                        onChange={handleChange}
                                                        placeholder="Prediction for health..."
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                                <div className="space-y-2">
                                                    <Label>Lucky Number</Label>
                                                    <Input name="luckyNumber" value={formData.luckyNumber} onChange={handleChange} placeholder="e.g. 7" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Lucky Color</Label>
                                                    <Input name="luckyColor" value={formData.luckyColor} onChange={handleChange} placeholder="e.g. Red" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Lucky Time</Label>
                                                    <Input name="luckyTime" value={formData.luckyTime} onChange={handleChange} placeholder="e.g. 2 PM - 4 PM" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Lucky Gem</Label>
                                                    <Input name="luckyGem" value={formData.luckyGem} onChange={handleChange} placeholder="e.g. Ruby" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
