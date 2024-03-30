"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoInfo } from "@/lib/types/video-info";
import { invoke } from "@tauri-apps/api/tauri";
import { Loader2, Search, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Page() {
    const [url, setUrl] = useState("");
    const [searching, setSearching] = useState(false);
    const [video, setVideo] = useState<null | VideoInfo>(null);
    const [format, setFormat] = useState("video");
    const [videoName, setVideoName] = useState("");
    const [audioName, setAudioName] = useState("");
    const [quality, setQuality] = useState<undefined | string>(undefined);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState("");
    const [downloadError, setDownloadError] = useState("");

    function getVideoInfo() {
        if (!url.trim() || searching) return;
        setSearching(true);
        invoke("get_video_info", { url })
        .then((res) => {
            setVideo(res as VideoInfo);
            setUrl("");
        }).catch((err) => {
            toast.error(err === "The video not found" ? "Not found" : "Unexpected error", {
                description: err === "The video not found" ? "Couldn't find the video, make sure the url is correct" : err,
                action: err != "The video not found" && {
                    label: "Retry",
                    onClick: () => getVideoInfo(),
                }
            });
        }).finally(() => {
            setSearching(false);
        });
    }

    async function downloadVideo() {
        if (!video) return;
        const format = video.formats.findLast((format) => format.qualityLabel === quality);
        if (!format) return
        setDownloading(true);
        
        invoke("video", { url: video.videoDetails.videoUrl, name: videoName, itag: format.itag })
        .then((e) => {
            setMessage(e as string);
            setDownloadError("");
        }).catch((e) => {
            setMessage("");
            setDownloadError(e as string);
        }).finally(() => {
            setDownloading(false);
        });
    }

    function downloadAudio() {
        if (!video) return;
        setDownloading(true);
        invoke("audio", { url: video.videoDetails.videoUrl, name: audioName })
        .then((e) => {
            console.log(e);
        }).catch(() => {
            console.log("fail");
        }).finally(() => {
            setDownloading(false);
        });
    }

    return (
        <div className="py-12 max-w-7xl mx-auto px-16">
            <form className="flex gap-2 flex-wrap"
            onSubmit={(e) => {
                e.preventDefault();
                getVideoInfo();
            }}
            >
                <div className="relative flex-grow">
                    <Search 
                    className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input 
                    className="pl-10"
                    placeholder="https://youtube.com"
                    autoComplete="off"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    />
                </div>
                <Button
                className="ml-auto"
                disabled={!url.trim() || searching}
                >
                    {searching && (
                        <Loader2 
                        className="size-4 mr-2 animate-spin"
                        />
                    )}
                    Search
                </Button>
            </form>
            {video && (
                <main className="mt-6 flex flex-col lg:flex-row items-start gap-4">
                    <div className="flex-grow w-full lg:w-auto">
                        <iframe className="w-full aspect-video rounded-lg" src={video.videoDetails.embed.iframeUrl} title={video.videoDetails.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>
                        <h1 className="mt-2 text-lg font-semibold">{video.videoDetails.title}</h1>
                        <div className="flex mt-2 items-start">
                            <a href={video.videoDetails.author.userUrl} className="pr-4" target="_blank">
                                <Avatar>
                                    <AvatarImage src={video.videoDetails.author.thumbnails[0].url} alt={video.videoDetails.author.user} />
                                    <AvatarFallback>{video.videoDetails.author.name}</AvatarFallback>
                                </Avatar>
                            </a>
                            <a href={video.videoDetails.author.userUrl} className="font-medium" target="_blank">{video.videoDetails.author.name}</a>
                        </div>
                    </div>
                    <Card className="w-full lg:w-80 bg-muted/50 flex-shrink-0 ml-auto">
                        <CardHeader>
                            <CardTitle>Download</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={format} onValueChange={(e) => setFormat(e)}>
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="video">Video</TabsTrigger>
                                    <TabsTrigger value="audio">Audio</TabsTrigger>
                                </TabsList>
                                <TabsContent value="video" className="bg-muted rounded-lg p-3">
                                    <h4 className="text-sm font-semibold flex items-center">
                                        <Settings2 
                                        className="size-4 mr-2"
                                        />
                                        Settings
                                    </h4>
                                    <form 
                                    id="download" 
                                    className="grid lg:block sm:grid-cols-2 gap-4"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        downloadVideo();
                                    }}
                                    >
                                        <div className="mt-4">
                                            <Label htmlFor="name">File name</Label>
                                            <Input 
                                            id="name" 
                                            placeholder="out" 
                                            className="mt-2 bg-muted ring-offset-muted border-muted-foreground" 
                                            autoComplete="off"
                                            value={videoName}
                                            onChange={(e) => setVideoName(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="mt-4">
                                            <Label htmlFor="select">Quality</Label>
                                            <Select value={quality} onValueChange={(e) => setQuality(e)}>
                                                <SelectTrigger id="select" className="border-muted-foreground bg-muted ring-offset-muted mt-2">
                                                    <SelectValue placeholder="Quality" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {video.formats.filter(({ hasVideo, mimeType, qualityLabel }, index, array) => {
                                                            const valid = (hasVideo && mimeType.includes("video/mp4"));
                                                            const notDupe = index === array.findLastIndex((format) => format.qualityLabel === qualityLabel);
                                                            return (valid && notDupe);
                                                        }).map(({ qualityLabel }) => {
                                                            return (
                                                                <SelectItem key={qualityLabel} value={qualityLabel}>{qualityLabel}</SelectItem>
                                                            )
                                                        })}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </form>
                                </TabsContent>
                                <TabsContent value="audio" className="bg-muted rounded-lg p-3">
                                    <h4 className="text-sm font-semibold flex items-center">
                                        <Settings2 
                                        className="size-4 mr-2"
                                        />
                                        Settings
                                    </h4>
                                    <form 
                                    id="download" 
                                    className="mt-4"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        downloadAudio();
                                    }}
                                    >
                                        <Label htmlFor="name">File name</Label>
                                        <Input 
                                        id="name" 
                                        placeholder="out" 
                                        className="mt-2 bg-muted ring-offset-muted border-muted-foreground" 
                                        autoComplete="off"
                                        value={audioName}
                                        onChange={(e) => setAudioName(e.target.value)}
                                        />
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                        <CardFooter>
                            <Button 
                            form="download" 
                            className="w-full"
                            disabled={downloading}
                            >
                                {downloading && (
                                    <Loader2 
                                    className="size-4 mr-2 animate-spin"
                                    />
                                )}
                                Download
                            </Button>
                            {message && <p className="text-sm font-medium">{message}</p>}
                            {downloadError && <p className="text-sm font-medium text-destructive">{downloadError}</p>}
                        </CardFooter>
                    </Card>
                </main>
            )}
        </div>
    )
}