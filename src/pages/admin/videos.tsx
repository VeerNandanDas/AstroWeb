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
import { ArrowLeft, Video, Loader2, Trash2, Plus } from "lucide-react";

interface Video {
    id: string;
    title: string;
    youtube_url: string;
    thumbnail_url: string;
    created_at: string;
}

export default function AdminVideos() {
    const router = useRouter();
    const { isAdmin, loading } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin) {
            fetchVideos();
        }
    }, [isAdmin]);

    const fetchVideos = async () => {
        try {
            setLoadingData(true);
            const { data, error } = await supabase
                .from("videos")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setVideos(data || []);
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const addVideo = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !youtubeUrl || !thumbnailUrl) {
            alert("Please fill in all fields");
            return;
        }

        try {
            setIsAdding(true);

            const { data, error } = await supabase
                .from("videos")
                .insert([
                    {
                        title,
                        youtube_url: youtubeUrl,
                        thumbnail_url: thumbnailUrl
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setVideos(prev => [data, ...prev]);

            // Reset form
            setTitle("");
            setYoutubeUrl("");
            setThumbnailUrl("");
            setShowForm(false);

            alert("Video added successfully!");
        } catch (error: any) {
            console.error("Error adding video:", error);
            alert(`Failed to add video: ${error.message}`);
        } finally {
            setIsAdding(false);
        }
    };

    const deleteVideo = async (id: string) => {
        if (!confirm("Are you sure you want to delete this video?")) {
            return;
        }

        try {
            setDeletingId(id);
            const { error } = await supabase
                .from("videos")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setVideos(prev => prev.filter(video => video.id !== id));
        } catch (error) {
            console.error("Error deleting video:", error);
            alert("Failed to delete video");
        } finally {
            setDeletingId(null);
        }
    };

    const extractVideoId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    };

    const getThumbnailFromUrl = (url: string) => {
        const videoId = extractVideoId(url);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
        return "";
    };

    const autoFillThumbnail = () => {
        if (youtubeUrl && !thumbnailUrl) {
            const thumbnail = getThumbnailFromUrl(youtubeUrl);
            if (thumbnail) {
                setThumbnailUrl(thumbnail);
            }
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
                <title>Manage Videos - Admin Dashboard</title>
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
                                <h1 className="font-serif text-4xl font-bold mb-2">Videos</h1>
                                <p className="text-primary-foreground/90">Manage video content</p>
                            </div>
                            <Button
                                onClick={() => setShowForm(!showForm)}
                                className="bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Video
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 py-8">
                    {/* Add Video Form */}
                    {showForm && (
                        <Card className="mb-8 border-primary/20">
                            <CardHeader>
                                <CardTitle>Add New Video</CardTitle>
                                <CardDescription>Add a YouTube video to the gallery</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={addVideo} className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Video Title</Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Enter video title"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="youtubeUrl">YouTube URL</Label>
                                        <Input
                                            id="youtubeUrl"
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                            onBlur={autoFillThumbnail}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="thumbnailUrl"
                                                value={thumbnailUrl}
                                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                                placeholder="https://img.youtube.com/vi/..."
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={autoFillThumbnail}
                                            >
                                                Auto-fill
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Click "Auto-fill" to generate thumbnail from YouTube URL
                                        </p>
                                    </div>

                                    {thumbnailUrl && (
                                        <div>
                                            <Label>Preview</Label>
                                            <img
                                                src={thumbnailUrl}
                                                alt="Thumbnail preview"
                                                className="w-full max-w-md rounded-lg mt-2"
                                                onError={(e) => {
                                                    e.currentTarget.src = "https://via.placeholder.com/480x360?text=Invalid+Thumbnail";
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={isAdding}>
                                            {isAdding ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Adding...
                                                </>
                                            ) : (
                                                "Add Video"
                                            )}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Videos List */}
                    {loadingData ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="mt-4 text-muted-foreground">Loading videos...</p>
                        </div>
                    ) : videos.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No videos found</p>
                                <Button onClick={() => setShowForm(true)} className="mt-4">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Video
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map((video) => (
                                <Card key={video.id} className="overflow-hidden hover-elevate transition-all">
                                    <div className="relative aspect-video">
                                        <img
                                            src={video.thumbnail_url}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://via.placeholder.com/480x360?text=Video";
                                            }}
                                        />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2">{video.title}</CardTitle>
                                        <CardDescription>
                                            Added: {new Date(video.created_at).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => window.open(video.youtube_url, "_blank")}
                                            >
                                                <Video className="h-4 w-4 mr-1" />
                                                Watch
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteVideo(video.id)}
                                                disabled={deletingId === video.id}
                                            >
                                                {deletingId === video.id ? (
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
