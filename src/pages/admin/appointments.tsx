import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Mail, Phone, User, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Appointment {
    id: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    consultation_type: string;
    message: string;
    status: string;
    payment_status: string;
    created_at: string;
}

export default function AdminAppointments() {
    const router = useRouter();
    const { isAdmin, loading } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin) {
            fetchAppointments();
        }
    }, [isAdmin]);

    const fetchAppointments = async () => {
        try {
            setLoadingData(true);
            const { data, error } = await supabase
                .from("appointments")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const updateAppointmentStatus = async (id: string, status: string) => {
        try {
            setUpdatingId(id);
            const { error } = await supabase
                .from("appointments")
                .update({ status })
                .eq("id", id);

            if (error) throw error;

            // Update local state
            setAppointments(prev =>
                prev.map(apt => apt.id === id ? { ...apt, status } : apt)
            );
        } catch (error) {
            console.error("Error updating appointment:", error);
            alert("Failed to update appointment status");
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteAppointment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this appointment?")) {
            return;
        }

        try {
            setUpdatingId(id);
            const { error } = await supabase
                .from("appointments")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setAppointments(prev => prev.filter(apt => apt.id !== id));
        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert("Failed to delete appointment");
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case "accepted":
                return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
            case "declined":
                return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
            case "completed":
                return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Payment Pending</Badge>;
            case "completed":
                return <Badge variant="outline" className="border-green-300 text-green-700">Paid</Badge>;
            case "failed":
                return <Badge variant="outline" className="border-red-300 text-red-700">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const filteredAppointments = filterStatus === "all"
        ? appointments
        : appointments.filter(apt => apt.status === filterStatus);

    return (
        <>
            <Head>
                <title>Manage Appointments - Admin Dashboard</title>
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
                        <h1 className="font-serif text-4xl font-bold mb-2">Appointments</h1>
                        <p className="text-primary-foreground/90">Manage consultation bookings</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 py-8">
                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        <Button
                            variant={filterStatus === "all" ? "default" : "outline"}
                            onClick={() => setFilterStatus("all")}
                        >
                            All ({appointments.length})
                        </Button>
                        <Button
                            variant={filterStatus === "pending" ? "default" : "outline"}
                            onClick={() => setFilterStatus("pending")}
                        >
                            Pending ({appointments.filter(a => a.status === "pending").length})
                        </Button>
                        <Button
                            variant={filterStatus === "accepted" ? "default" : "outline"}
                            onClick={() => setFilterStatus("accepted")}
                        >
                            Accepted ({appointments.filter(a => a.status === "accepted").length})
                        </Button>
                        <Button
                            variant={filterStatus === "completed" ? "default" : "outline"}
                            onClick={() => setFilterStatus("completed")}
                        >
                            Completed ({appointments.filter(a => a.status === "completed").length})
                        </Button>
                    </div>

                    {/* Appointments List */}
                    {loadingData ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="mt-4 text-muted-foreground">Loading appointments...</p>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No appointments found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredAppointments.map((appointment) => (
                                <Card key={appointment.id} className="hover-elevate transition-all">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <User className="h-5 w-5 text-primary" />
                                                    {appointment.name}
                                                </CardTitle>
                                                <CardDescription className="mt-2 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        {appointment.email}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4" />
                                                        {appointment.phone}
                                                    </div>
                                                </CardDescription>
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                                {getStatusBadge(appointment.status)}
                                                {getPaymentBadge(appointment.payment_status)}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Consultation Type</p>
                                                <p className="font-semibold capitalize">{appointment.consultation_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Appointment Date & Time</p>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    <span className="font-semibold">{appointment.date}</span>
                                                    <Clock className="h-4 w-4 text-primary ml-2" />
                                                    <span className="font-semibold">{appointment.time}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {appointment.message && (
                                            <div className="mb-4 p-3 bg-muted rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Message</p>
                                                <p className="text-sm">{appointment.message}</p>
                                            </div>
                                        )}

                                        <div className="text-xs text-muted-foreground mb-4">
                                            Created: {new Date(appointment.created_at).toLocaleString()}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            {appointment.status === "pending" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateAppointmentStatus(appointment.id, "accepted")}
                                                        disabled={updatingId === appointment.id}
                                                    >
                                                        {updatingId === appointment.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Accept
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => updateAppointmentStatus(appointment.id, "declined")}
                                                        disabled={updatingId === appointment.id}
                                                    >
                                                        {updatingId === appointment.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Decline
                                                            </>
                                                        )}
                                                    </Button>
                                                </>
                                            )}
                                            {appointment.status === "accepted" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                                                    disabled={updatingId === appointment.id}
                                                >
                                                    Mark as Completed
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteAppointment(appointment.id)}
                                                disabled={updatingId === appointment.id}
                                            >
                                                Delete
                                            </Button>
                                        </div>
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
