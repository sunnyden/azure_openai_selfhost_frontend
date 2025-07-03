import React, { useState, useRef, useEffect } from "react";
import { Button } from "@fluentui/react-components";
import {
    Play24Regular,
    Pause24Regular,
    Speaker224Regular,
} from "@fluentui/react-icons";

interface CustomAudioPlayerProps {
    src: string;
    onError?: () => void;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({
    src,
    onError,
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleError = () => {
            setHasError(true);
            setIsLoading(false);
            onError?.();
        };

        const handleCanPlayThrough = () => {
            setIsLoading(false);
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);
        audio.addEventListener("canplaythrough", handleCanPlayThrough);

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);
            audio.removeEventListener("canplaythrough", handleCanPlayThrough);
        };
    }, [onError]);

    const togglePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio || hasError) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                await audio.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error("Error playing audio:", error);
            setHasError(true);
            onError?.();
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || hasError) return;

        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        const newTime = clickPosition * duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (time: number): string => {
        if (isNaN(time) || time < 0) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (hasError) {
        return (
            <div className="custom-audio-player error">
                <div className="audio-icon">
                    <Speaker224Regular />
                </div>
                <span className="error-text">Audio failed to load</span>
            </div>
        );
    }

    return (
        <div className="custom-audio-player">
            <audio ref={audioRef} src={src} preload="metadata" />

            <Button
                appearance="subtle"
                icon={isPlaying ? <Pause24Regular /> : <Play24Regular />}
                onClick={togglePlayPause}
                disabled={isLoading || hasError}
                className="play-pause-button"
                size="small"
            />

            <div className="audio-progress-container">
                <div
                    className="audio-progress-bar"
                    onClick={handleProgressClick}
                >
                    <div
                        className="audio-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="audio-time">
                    <span className="current-time">
                        {formatTime(currentTime)}
                    </span>
                    <span className="duration">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};
