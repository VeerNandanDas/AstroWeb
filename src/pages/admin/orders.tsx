import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Loader2, Mail, Phone, User, Package } from "lucide-react";

interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    items: string;
    total_amount: string;
    payment_status: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    created_at: string;
}

export default function AdminOrders() {
    const router = useRouter();
    const { isAdmin, loading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin) {
            fetchOrders();
        }
    }, [isAdmin]);

    const fetchOrders = async () => {
        try {
            setLoadingData(true);
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800">Payment Pending</Badge>;
            case "completed":
                return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
            case "failed":
                return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const filteredOrders = filterStatus === "all"
        ? orders
        : orders.filter(order => order.payment_status === filterStatus);

    return (
        <>
            <Head>
                <title>Manage Orders - Admin Dashboard</title>
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
                        <h1 className="font-serif text-4xl font-bold mb-2">Orders</h1>
                        <p className="text-primary-foreground/90">Manage customer orders</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 py-8">
                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        <Button
                            variant={filterStatus === "all" ? "default" : "outline"}
                            onClick={() => setFilterStatus("all")}
                        >
                            All ({orders.length})
                        </Button>
                        <Button
                            variant={filterStatus === "pending" ? "default" : "outline"}
                            onClick={() => setFilterStatus("pending")}
                        >
                            Pending ({orders.filter(o => o.payment_status === "pending").length})
                        </Button>
                        <Button
                            variant={filterStatus === "completed" ? "default" : "outline"}
                            onClick={() => setFilterStatus("completed")}
                        >
                            Completed ({orders.filter(o => o.payment_status === "completed").length})
                        </Button>
                    </div>

                    {/* Orders List */}
                    {loadingData ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="mt-4 text-muted-foreground">Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No orders found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => {
                                let items = [];
                                try {
                                    items = JSON.parse(order.items);
                                } catch (e) {
                                    console.error("Error parsing order items:", e);
                                }

                                return (
                                    <Card key={order.id} className="hover-elevate transition-all">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <User className="h-5 w-5 text-primary" />
                                                        {order.customer_name}
                                                    </CardTitle>
                                                    <CardDescription className="mt-2 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4" />
                                                            {order.customer_email}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4" />
                                                            {order.customer_phone}
                                                        </div>
                                                    </CardDescription>
                                                </div>
                                                <div className="flex flex-col gap-2 items-end">
                                                    {getPaymentBadge(order.payment_status)}
                                                    <div className="text-xl font-bold text-primary">
                                                        ₹{parseFloat(order.total_amount).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                                                    <p className="text-sm">{order.shipping_address}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">Order Items</p>
                                                    <div className="space-y-2">
                                                        {items.map((item: any, index: number) => (
                                                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                                                <div className="flex items-center gap-2">
                                                                    <Package className="h-4 w-4 text-primary" />
                                                                    <span className="text-sm">{item.name}</span>
                                                                </div>
                                                                <div className="text-sm">
                                                                    Qty: {item.quantity} × ₹{item.price}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {order.razorpay_payment_id && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">Payment ID</p>
                                                        <p className="text-xs font-mono">{order.razorpay_payment_id}</p>
                                                    </div>
                                                )}

                                                <div className="text-xs text-muted-foreground">
                                                    Order Date: {new Date(order.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
