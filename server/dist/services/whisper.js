"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whisperService = exports.WhisperService = void 0;
const transformers_1 = require("@huggingface/transformers");
class WhisperService {
    transcriber;
    constructor() {
        if (process.env.NODE_ENV !== 'test') {
            this.loadModel();
        }
    }
    async loadModel() {
        if (!this.transcriber) {
            console.log("Loading Whisper model...");
            this.transcriber = await (0, transformers_1.pipeline)("automatic-speech-recognition", "Xenova/whisper-tiny.en");
            console.log("Whisper model loaded!");
        }
    }
    async transcribe(audioBuffer) {
        try {
            await this.loadModel();
            if (!audioBuffer || !Buffer.isBuffer(audioBuffer)) {
                throw new Error("Invalid audio buffer");
            }
            console.log("Transcribing audio... length =", audioBuffer.length);
            // Parse WAV file header to extract audio data
            const audioData = this.parseWavBuffer(audioBuffer);
            if (!audioData) {
                throw new Error("Failed to parse WAV file");
            }
            console.log("Audio data length:", audioData.length, "samples");
            const result = await this.transcriber(audioData);
            return {
                success: true,
                data: {
                    transcription: result.text,
                },
            };
        }
        catch (error) {
            console.error("Transcription failed:", error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    parseWavBuffer(buffer) {
        try {
            // Check if it's a WAV file
            const riffHeader = buffer.toString('ascii', 0, 4);
            const waveHeader = buffer.toString('ascii', 8, 12);
            if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
                console.log("Not a WAV file, treating as raw audio data");
                // If it's not a WAV file, try to convert as raw audio
                return this.convertRawAudioToFloat32(buffer);
            }
            // Find the data chunk
            let offset = 12;
            let dataOffset = -1;
            let dataLength = 0;
            let sampleRate = 16000; // Default sample rate
            let channels = 1; // Default mono
            let bitsPerSample = 16; // Default 16-bit
            while (offset < buffer.length - 8) {
                const chunkId = buffer.toString('ascii', offset, offset + 4);
                const chunkSize = buffer.readUInt32LE(offset + 4);
                if (chunkId === 'fmt ') {
                    // Parse format chunk
                    const audioFormat = buffer.readUInt16LE(offset + 8);
                    channels = buffer.readUInt16LE(offset + 10);
                    sampleRate = buffer.readUInt32LE(offset + 12);
                    bitsPerSample = buffer.readUInt16LE(offset + 22);
                    console.log(`WAV format: ${audioFormat}, channels: ${channels}, sampleRate: ${sampleRate}, bitsPerSample: ${bitsPerSample}`);
                }
                else if (chunkId === 'data') {
                    dataOffset = offset + 8;
                    dataLength = chunkSize;
                    break;
                }
                offset += 8 + chunkSize;
            }
            if (dataOffset === -1) {
                throw new Error("No data chunk found in WAV file");
            }
            // Extract audio data
            const audioDataBuffer = buffer.slice(dataOffset, dataOffset + dataLength);
            // Convert to Float32Array based on bit depth
            if (bitsPerSample === 16) {
                return this.convert16BitToFloat32(audioDataBuffer);
            }
            else if (bitsPerSample === 32) {
                return this.convert32BitToFloat32(audioDataBuffer);
            }
            else {
                throw new Error(`Unsupported bit depth: ${bitsPerSample}`);
            }
        }
        catch (error) {
            console.error("Error parsing WAV file:", error);
            return null;
        }
    }
    convert16BitToFloat32(buffer) {
        const samples = new Float32Array(buffer.length / 2);
        for (let i = 0; i < samples.length; i++) {
            const sample = buffer.readInt16LE(i * 2);
            samples[i] = sample / 32768.0; // Normalize to [-1, 1]
        }
        return samples;
    }
    convert32BitToFloat32(buffer) {
        const samples = new Float32Array(buffer.length / 4);
        for (let i = 0; i < samples.length; i++) {
            const sample = buffer.readFloatLE(i * 4);
            samples[i] = sample;
        }
        return samples;
    }
    convertRawAudioToFloat32(buffer) {
        // Assume raw audio is 16-bit signed integers
        const samples = new Float32Array(buffer.length / 2);
        for (let i = 0; i < samples.length; i++) {
            const sample = buffer.readInt16LE(i * 2);
            samples[i] = sample / 32768.0; // Normalize to [-1, 1]
        }
        return samples;
    }
}
exports.WhisperService = WhisperService;
exports.whisperService = new WhisperService();
//# sourceMappingURL=whisper.js.map