import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sunrise, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminMuhurat() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Helper to get month name from YYYY-MM
    const getMonthName = (dateStr: string) => {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const monthIndex = parseInt(dateStr.split('-')[1], 10) - 1;
        return monthNames[monthIndex] || "";
    };

    const [muhuratData, setMuhuratData] = useState({
        vehiclePurchase: "",
        miscellaneousPurchase: "",
        newHome: "",
        auspiciousDays: "",
        inauspiciousDays: "",
        note: ""
    });

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin && selectedMonth) {
            fetchMuhurat();
        }
    }, [isAdmin, selectedMonth]);

    const fetchMuhurat = async () => {
        try {
            const response = await fetch(`/api/muhurat?month=${selectedMonth}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const muhurat = data[0];
                    setMuhuratData({
                        vehiclePurchase: muhurat.vehiclePurchase || "",
                        miscellaneousPurchase: muhurat.miscellaneousPurchase || "",
                        newHome: muhurat.newHome || "",
                        auspiciousDays: muhurat.auspiciousDays || "",
                        inauspiciousDays: muhurat.inauspiciousDays || "",
                        note: muhurat.note || ""
                    });
                } else {
                    // Reset form for new month
                    setMuhuratData({
                        vehiclePurchase: "",
                        miscellaneousPurchase: "",
                        newHome: "",
                        auspiciousDays: "",
                        inauspiciousDays: "",
                        note: ""
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching muhurat:", error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const [year, month] = selectedMonth.split('-');

            const token = localStorage.getItem("token");
            const response = await fetch("/api/muhurat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: parseInt(year),
                    monthName: getMonthName(selectedMonth),
                    ...muhuratData
                })
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Muhurat saved successfully!",
                });
            } else {
                throw new Error("Failed to save muhurat");
            }
        } catch (error) {
            console.error("Error saving muhurat:", error);
            toast({
                title: "Error",
                description: "Failed to save muhurat. Please try again.",
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
                <title>Manage Muhurat - Admin Dashboard</title>
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
                            <Sunrise className="h-10 w-10" />
                            <div>
                                <h1 className="font-serif text-4xl font-bold">Manage Muhurat</h1>
                                <p className="text-primary-foreground/90">Set auspicious timings for the month</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 lg:px-8 py-8">
                    <Card className="max-w-4xl mx-auto">
                        <CardHeader>
                            <CardTitle>Monthly Muhurat Details</CardTitle>
                            <CardDescription>
                                Enter the auspicious days and timings for the selected month
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Month Selection */}
                            <div>
                                <Label htmlFor="month">Month</Label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="max-w-xs"
                                />
                            </div>

                            {/* Purchase Timings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="vehiclePurchase">Vehicle Purchase (वाहन खरीद)</Label>
                                    <Textarea
                                        id="vehiclePurchase"
                                        placeholder="e.g., 18 (after 10:15), 19 (Till Midnight)"
                                        value={muhuratData.vehiclePurchase}
                                        onChange={(e) => setMuhuratData({ ...muhuratData, vehiclePurchase: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="miscellaneousPurchase">Miscellaneous Purchase (Jewelry, etc.)</Label>
                                    <Textarea
                                        id="miscellaneousPurchase"
                                        placeholder="e.g., 13, 14 (till 12:13)"
                                        value={muhuratData.miscellaneousPurchase}
                                        onChange={(e) => setMuhuratData({ ...muhuratData, miscellaneousPurchase: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* Home & Auspicious Days */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label htmlFor="newHome">Move to a New Home (गृह प्रवेश)</Label>
                                    <Textarea
                                        id="newHome"
                                        placeholder="e.g., 16 (16:39 to 18:18), 18 (After 10:15)"
                                        value={muhuratData.newHome}
                                        onChange={(e) => setMuhuratData({ ...muhuratData, newHome: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="auspiciousDays">Auspicious Days (सामान्य शुभ दिन)</Label>
                                    <Textarea
                                        id="auspiciousDays"
                                        placeholder="e.g., 13, 14, 16, 18, 19, 21..."
                                        value={muhuratData.auspiciousDays}
                                        onChange={(e) => setMuhuratData({ ...muhuratData, auspiciousDays: e.target.value })}
                                        rows={2}
                                        className="border-green-200 focus-visible:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="inauspiciousDays">Inauspicious Days (शुभ कार्य वर्जित दिन)</Label>
                                    <Textarea
                                        id="inauspiciousDays"
                                        placeholder="e.g., 15, 17, 20, 22, 23..."
                                        value={muhuratData.inauspiciousDays}
                                        onChange={(e) => setMuhuratData({ ...muhuratData, inauspiciousDays: e.target.value })}
                                        rows={2}
                                        className="border-red-200 focus-visible:ring-red-500"
                                    />
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <Label htmlFor="note">Note</Label>
                                <Textarea
                                    id="note"
                                    placeholder="Important notes regarding time zones, etc."
                                    value={muhuratData.note}
                                    onChange={(e) => setMuhuratData({ ...muhuratData, note: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    size="lg"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? "Saving..." : "Save Monthly Muhurat"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
