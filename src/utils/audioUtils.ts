/**
 * Audio processing utilities for chat audio upload functionality
 */

/**
 * Convert audio file to base64 string
 * @param file - The audio file to convert
 * @returns Promise<string> - Base64 encoded audio data
 */
export function audioToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
        };

        reader.onerror = () => {
            reject(new Error("Failed to read audio file"));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Validate if a file is a supported audio type
 * @param file - File to validate
 * @returns boolean - True if file is a supported audio format (MP3 or WAV)
 */
export function isValidAudioFile(file: File): boolean {
    // Support MP3 and WAV formats as specified
    // These formats are compatible with LLMs (no OPUS)
    const supportedTypes = [
        "audio/mpeg", // MP3 format
        "audio/mp3", // Alternative MP3 MIME type
        "audio/wav", // WAV format (PCM)
        "audio/wave", // Alternative WAV MIME type
    ];
    return supportedTypes.includes(file.type);
}

/**
 * Get audio duration in seconds
 * @param file - The audio file
 * @returns Promise<number> - Duration in seconds
 */
export function getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);

        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(audio.duration);
        };

        audio.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Failed to load audio file"));
        };

        audio.src = objectUrl;
    });
}

/**
 * Format duration in seconds to human readable format (mm:ss)
 * @param seconds - Duration in seconds
 * @returns string - Formatted duration
 */
export function formatDuration(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Start recording audio from microphone
 * @returns Promise<MediaRecorder> - MediaRecorder instance
 */
export async function startAudioRecording(): Promise<MediaRecorder> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                // Note: Browser may ignore sampleRate constraint and use 48kHz
                // We'll convert to 16kHz in post-processing
                sampleSize: 16, // 16-bit audio
                channelCount: 1, // Mono (1 channel)
            },
        });

        // Prefer audio/wav format to avoid OPUS codec issues
        // Fall back to audio/webm only if WAV is not supported
        let mimeType: string;
        if (MediaRecorder.isTypeSupported("audio/wav")) {
            mimeType = "audio/wav";
        } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=pcm")) {
            mimeType = "audio/webm;codecs=pcm";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            mimeType = "audio/webm"; // Will need conversion
        } else {
            throw new Error("No supported audio recording format available");
        }

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType,
        });

        return mediaRecorder;
    } catch (error) {
        throw new Error(`Failed to start audio recording: ${error}`);
    }
}

/**
 * Convert audio blob to PCM WAV format (16kHz, 16-bit, mono) using Web Audio API
 * @param blob - Audio blob to convert
 * @returns Promise<Blob> - WAV format blob with PCM 16kHz 16-bit mono encoding
 */
async function convertToWAV(blob: Blob): Promise<Blob> {
    const audioContext = new AudioContext({
        sampleRate: 16000, // 16kHz as specified for LLM compatibility
    });

    try {
        // Convert blob to array buffer
        const arrayBuffer = await blob.arrayBuffer();

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        console.log(
            `Original audio: ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.length} samples`
        );

        // Convert to mono if needed and resample to 16kHz
        const processedBuffer = await processAudioBuffer(
            audioBuffer,
            audioContext
        );

        console.log(
            `Processed audio: ${processedBuffer.sampleRate}Hz, ${processedBuffer.numberOfChannels} channels, ${processedBuffer.length} samples`
        );

        // Convert to WAV format
        const wavBlob = audioBufferToWAV(processedBuffer);

        return wavBlob;
    } catch (error) {
        console.error("Audio conversion failed:", error);
        // If conversion fails, return original blob but with WAV mime type
        // This is a fallback - the actual data might still be in original format
        return new Blob([blob], { type: "audio/wav" });
    } finally {
        // Clean up audio context
        await audioContext.close();
    }
}

/**
 * Process audio buffer to ensure 16kHz, 16-bit, mono format
 * @param buffer - Original AudioBuffer
 * @param audioContext - AudioContext for processing
 * @returns Promise<AudioBuffer> - Processed audio buffer
 */
async function processAudioBuffer(
    buffer: AudioBuffer,
    audioContext: AudioContext
): Promise<AudioBuffer> {
    const targetSampleRate = 16000;
    const targetChannels = 1;

    // If already in correct format, return as-is
    if (
        buffer.sampleRate === targetSampleRate &&
        buffer.numberOfChannels === targetChannels
    ) {
        console.log("Audio already in target format (16kHz mono)");
        return buffer;
    }

    console.log(
        `Converting audio from ${buffer.sampleRate}Hz ${buffer.numberOfChannels}ch to ${targetSampleRate}Hz ${targetChannels}ch`
    );

    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
        targetChannels,
        Math.ceil((buffer.length * targetSampleRate) / buffer.sampleRate),
        targetSampleRate
    );

    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // If stereo, convert to mono by creating a merger/splitter
    if (buffer.numberOfChannels > 1) {
        const merger = offlineContext.createChannelMerger(1);
        const splitter = offlineContext.createChannelSplitter(
            buffer.numberOfChannels
        );

        source.connect(splitter);
        splitter.connect(merger, 0, 0); // Use only left channel
        merger.connect(offlineContext.destination);
    } else {
        source.connect(offlineContext.destination);
    }

    source.start();

    return await offlineContext.startRendering();
}

/**
 * Convert AudioBuffer to WAV format blob with PCM 16kHz 16-bit mono format
 * @param buffer - AudioBuffer to convert
 * @returns Blob - WAV format blob with PCM encoding (16kHz, 16-bit, mono)
 */
function audioBufferToWAV(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const numberOfChannels = 1; // Force mono output
    const sampleRate = 16000; // Force 16kHz sample rate
    const bitsPerSample = 16; // 16-bit audio
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // RIFF chunk descriptor
    writeString(0, "RIFF");
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, "WAVE");

    // fmt sub-chunk
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // Sub-chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    // Write audio data (mono channel)
    let offset = 44;
    const channelData =
        buffer.numberOfChannels === 1
            ? buffer.getChannelData(0)
            : buffer.getChannelData(0); // Use left channel if stereo

    for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
}

/**
 * Convert recorded audio blob to PCM WAV format (16kHz, 16-bit, mono) and then to base64
 * @param blob - Audio blob from MediaRecorder
 * @returns Promise<{ base64: string, file: File }> - Base64 string and File object
 */
export async function processRecordedAudio(
    blob: Blob
): Promise<{ base64: string; file: File }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `recording_${timestamp}.wav`;

    let processedBlob: Blob;

    // Convert to PCM WAV format if needed
    if (blob.type.includes("webm") || blob.type.includes("opus")) {
        console.log("Converting audio to PCM WAV format...");
        processedBlob = await convertToWAV(blob);
    } else if (blob.type.includes("wav")) {
        // Even if WAV format, we need to ensure it's 16kHz mono
        console.log("Converting WAV to 16kHz mono format...");
        processedBlob = await convertToWAV(blob);
    } else {
        // Unknown format, attempt conversion
        console.log("Unknown audio format, attempting conversion to WAV...");
        processedBlob = await convertToWAV(blob);
    }

    const file = new File([processedBlob], fileName, { type: "audio/wav" });

    // Convert to base64
    const base64 = await audioToBase64(file);

    return { base64, file };
}

/**
 * Stop all tracks in a media stream
 * @param stream - MediaStream to stop
 */
export function stopMediaStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
}
