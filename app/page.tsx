"use client";

import Audio from "@/components/audio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Video from "@/components/video";

export default function Home() {

    return (
        <main className="h-screen grid place-items-center">
            <Tabs defaultValue="video" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="video">Video</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                </TabsList>
                <TabsContent value="video">
                    <Video />
                </TabsContent>
                <TabsContent value="audio">
                    <Audio />
                </TabsContent>
            </Tabs>
        </main>
    );
}
