"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import { Label } from "./ui/label";
import { Loader2Icon } from "lucide-react";

export default function Video() {
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [url, setUrl] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function download() {
        setMessage("");
        setError("");
        setIsLoading(true);

        invoke<string>("video", {
            url,
            name,
        })
        .then((message) => setMessage(message))
        .catch((error) => setError(error))
        .finally(() => setIsLoading(false));
    }

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                value={url}
                id="url"
                onChange={(e) => setUrl(e.target.value)}
                />
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="name">File name</Label>
                <Input
                value={name}
                id="name"
                onChange={(e) => setName(e.target.value)}
                />
            </div>

            <Button
            aria-disabled={isLoading}
            onClick={download}
            >
                {isLoading && (
                    <Loader2Icon
                    className="mr-2 size-4 animate-spin"
                    />
                )}
                {isLoading ? "Downloading" : "Download"}
            </Button>

            {message && <p className="text-sm font-medium">{message}</p>}
            {error && <p className="text-sm font-medium text-destructive">Error: {error}</p>}
        </div>
    )
}