// FFmpeg.wasm service for client-side video processing
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

class FFmpegService {
    constructor() {
        this.ffmpeg = null;
        this.loaded = false;
        this.loading = false;
    }

    /**
     * Load FFmpeg.wasm (heavy ~25MB)
     * @param {Function} onProgress - Callback (progress: 0-1)
     */
    async load(onProgress = null) {
        if (this.loaded) return;
        if (this.loading) {
            // Wait for current loading to complete
            while (this.loading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        try {
            this.loading = true;
            this.ffmpeg = new FFmpeg();

            // Setup progress logging
            this.ffmpeg.on('log', ({ message }) => {
                console.log('[FFmpeg]', message);
            });

            // Load directly from CDN (no toBlobURL needed with correct CORS)
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

            await this.ffmpeg.load({
                coreURL: `${baseURL}/ffmpeg-core.js`,
                wasmURL: `${baseURL}/ffmpeg-core.wasm`,
            });

            this.loaded = true;
            this.loading = false;
            console.log('[FFmpeg] Loaded successfully');

            if (onProgress) onProgress(1);
        } catch (error) {
            this.loading = false;
            console.error('[FFmpeg] Load failed:', error);
            throw new Error('Failed to load FFmpeg: ' + error.message);
        }
    }

    /**
     * Cut video segment
     * @param {Blob} videoBlob - Input video
     * @param {number} start - Start time (seconds)
     * @param {number} end - End time (seconds)
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Blob>} - Output clip
     */
    async cutVideo(videoBlob, start, end, onProgress = null) {
        if (!this.loaded) {
            throw new Error('FFmpeg not loaded. Call load() first.');
        }

        try {
            const inputName = 'input.webm'; // WebM from MediaRecorder
            const outputName = 'output.mp4';
            const duration = end - start;

            // Write input to FFmpeg virtual FS
            await this.ffmpeg.writeFile(inputName, await fetchFile(videoBlob));

            // Progress tracking
            if (onProgress) {
                this.ffmpeg.on('progress', ({ progress }) => {
                    onProgress(progress);
                });
            }

            // Re-encode WebM to MP4 (VP8→H.264)
            await this.ffmpeg.exec([
                '-ss', start.toString(),
                '-i', inputName,
                '-t', duration.toString(),
                '-c:v', 'libx264',      // H.264 video
                '-preset', 'ultrafast', // Fast encoding
                '-crf', '23',           // Quality
                '-c:a', 'aac',          // AAC audio
                '-b:a', '128k',
                outputName
            ]);

            // Read output
            const data = await this.ffmpeg.readFile(outputName);

            // Cleanup
            await this.ffmpeg.deleteFile(inputName);
            await this.ffmpeg.deleteFile(outputName);

            // Convert to Blob
            return new Blob([data.buffer], { type: 'video/mp4' });

        } catch (error) {
            console.error('[FFmpeg] Cut failed:', error);
            throw new Error('Video cutting failed: ' + error.message);
        }
    }

    /**
     * Check if FFmpeg is loaded
     */
    isLoaded() {
        return this.loaded;
    }

    /**
     * Cleanup FFmpeg instance
     */
    terminate() {
        if (this.ffmpeg) {
            this.ffmpeg.terminate();
            this.ffmpeg = null;
            this.loaded = false;
        }
    }
}

// Singleton instance
export const ffmpegService = new FFmpegService();
