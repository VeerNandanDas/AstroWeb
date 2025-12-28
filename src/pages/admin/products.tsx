import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Loader2, Plus, Trash2, Edit, X } from "lucide-react";

interface Product {
    id: string;
    name: string;
    category: string;
    price: string;
    description: string;
    images: string[];
    benefits: string[];
    certified: boolean;
    in_stock: boolean;
    rating: string;
    review_count: number;
}

const CATEGORIES = ["gemstones", "bracelets", "rudraksha", "yantras", "rings", "remedies"];

export default function AdminProducts() {
    const router = useRouter();
    const { isAdmin, loading } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [category, setCategory] = useState("gemstones");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [imagesInput, setImagesInput] = useState("");
    const [benefitsInput, setBenefitsInput] = useState("");
    const [certified, setCertified] = useState(true);
    const [inStock, setInStock] = useState(true);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin) {
            fetchProducts();
        }
    }, [isAdmin]);

    const fetchProducts = async () => {
        try {
            setLoadingData(true);
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const resetForm = () => {
        setName("");
        setCategory("gemstones");
        setPrice("");
        setDescription("");
        setImagesInput("");
        setBenefitsInput("");
        setCertified(true);
        setInStock(true);
        setEditingId(null);
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setName(product.name);
        setCategory(product.category);
        setPrice(product.price);
        setDescription(product.description);
        setImagesInput(product.images.join("\n"));
        setBenefitsInput(product.benefits.join("\n"));
        setCertified(product.certified);
        setInStock(product.in_stock);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !category || !price || !description) {
            alert("Please fill in all required fields");
            return;
        }

        const images = imagesInput.split("\n").filter(url => url.trim() !== "");
        const benefits = benefitsInput.split("\n").filter(b => b.trim() !== "");

        if (images.length === 0) {
            alert("Please add at least one image URL");
            return;
        }

        try {
            setIsSubmitting(true);

            const productData = {
                name,
                category,
                price: parseFloat(price).toFixed(2),
                description,
                images,
                benefits,
                certified,
                in_stock: inStock,
                rating: "4.50",
                review_count: 0,
            };

            if (editingId) {
                // Update existing product
                const { error } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", editingId);

                if (error) throw error;

                setProducts(prev =>
                    prev.map(p => p.id === editingId ? { ...p, ...productData } : p)
                );
                alert("Product updated successfully!");
            } else {
                // Create new product
                const { data, error } = await supabase
                    .from("products")
                    .insert([productData])
                    .select()
                    .single();

                if (error) throw error;

                setProducts(prev => [data, ...prev]);
                alert("Product added successfully!");
            }

            resetForm();
            setShowForm(false);
        } catch (error: any) {
            console.error("Error saving product:", error);
            alert(`Failed to save product: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            setDeletingId(id);
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setProducts(prev => prev.filter(p => p.id !== id));
            alert("Product deleted successfully!");
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product");
        } finally {
            setDeletingId(null);
        }
    };

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
                <title>Manage Products - Admin Dashboard</title>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="font-serif text-4xl font-bold mb-2">Products</h1>
                                <p className="text-primary-foreground/90">Manage product catalog</p>
                            </div>
                            <Button
                                onClick={() => {
                                    resetForm();
                                    setShowForm(!showForm);
                                }}
                                className="bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {showForm ? "Cancel" : "Add Product"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 py-8">
                    {/* Add/Edit Product Form */}
                    {showForm && (
                        <Card className="mb-8 border-primary/20">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{editingId ? "Edit Product" : "Add New Product"}</CardTitle>
                                        <CardDescription>Fill in the product details</CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            resetForm();
                                            setShowForm(false);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">Product Name *</Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g., Blue Sapphire Gemstone"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="category">Category *</Label>
                                            <select
                                                id="category"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                                required
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>
                                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label htmlFor="price">Price (₹) *</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                placeholder="999.99"
                                                required
                                            />
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="certified"
                                                    checked={certified}
                                                    onChange={(e) => setCertified(e.target.checked)}
                                                    className="w-4 h-4"
                                                />
                                                <Label htmlFor="certified" className="cursor-pointer">Certified</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="inStock"
                                                    checked={inStock}
                                                    onChange={(e) => setInStock(e.target.checked)}
                                                    className="w-4 h-4"
                                                />
                                                <Label htmlFor="inStock" className="cursor-pointer">In Stock</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description *</Label>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Enter detailed product description..."
                                            rows={4}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="images">Image URLs (one per line) *</Label>
                                        <Textarea
                                            id="images"
                                            value={imagesInput}
                                            onChange={(e) => setImagesInput(e.target.value)}
                                            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="benefits">Benefits (one per line)</Label>
                                        <Textarea
                                            id="benefits"
                                            value={benefitsInput}
                                            onChange={(e) => setBenefitsInput(e.target.value)}
                                            placeholder="Enhances wisdom&#10;Promotes spiritual growth&#10;Brings prosperity"
                                            rows={4}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>{editingId ? "Update Product" : "Add Product"}</>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                resetForm();
                                                setShowForm(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Products List */}
                    {loadingData ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="mt-4 text-muted-foreground">Loading products...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-4">No products found</p>
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Product
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <Card key={product.id} className="overflow-hidden hover-elevate transition-all">
                                    <div className="relative aspect-square">
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://via.placeholder.com/400?text=Product";
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            {product.certified && <Badge className="bg-green-500">Certified</Badge>}
                                            {!product.in_stock && <Badge variant="destructive">Out of Stock</Badge>}
                                        </div>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                                        <CardDescription>
                                            <Badge variant="outline" className="capitalize">{product.category}</Badge>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-4">
                                            <p className="text-2xl font-bold text-primary">₹{parseFloat(product.price).toFixed(2)}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                                {product.description}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleEdit(product)}
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteProduct(product.id)}
                                                disabled={deletingId === product.id}
                                            >
                                                {deletingId === product.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
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
