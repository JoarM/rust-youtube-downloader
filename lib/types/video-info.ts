export type VideoInfo = {
    formats: Formtas[];
    videoDetails: {
        author: {
            userUrl: string;
            user: string;
            name: string;
            thumbnails: Thumbnails[];
        },
        embed: {
            iframeUrl: string;
        }
        title: string;
        videoUrl: string;
    }
}

export type Formtas = {
    qualityLabel: string;
    url: string;
    hasAudio: boolean;
    hasVideo: boolean;
    itag: number;
    mimeType: string;
}

export type Thumbnails = {
    width: number;
    height: number;
    url: string;
}