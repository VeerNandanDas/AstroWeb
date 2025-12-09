import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Star, Loader2, Construction } from "lucide-react";

export default function AdminTestimonials() {
    const router = useRouter();
    const { isAdmin, loading } = useAuth();

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    if (loading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Manage Testimonials - Admin Dashboard</title>
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
                        <h1 className="font-serif text-4xl font-bold mb-2">Testimonials</h1>
                        <p className="text-primary-foreground/90">Manage customer reviews</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 py-8">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Construction className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Coming Soon</CardTitle>
                                    <CardDescription>This feature is under development</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                The testimonials management interface is currently being developed. Soon you'll be able to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Add, edit, and delete testimonials</li>
                                <li>Verify and moderate customer reviews</li>
                                <li>Add customer avatars and locations</li>
                                <li>Set star ratings</li>
                                <li>Feature testimonials on homepage</li>
                            </ul>
                            <div className="pt-4">
                                <Link href="/admin">
                                    <Button>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
