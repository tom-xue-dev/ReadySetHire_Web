export declare class WhisperService {
    private transcriber;
    constructor();
    private loadModel;
    transcribe(audioBuffer: Buffer): Promise<{
        success: boolean;
        data: {
            transcription: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    private parseWavBuffer;
    private convert16BitToFloat32;
    private convert32BitToFloat32;
    private convertRawAudioToFloat32;
}
export declare const whisperService: WhisperService;
//# sourceMappingURL=whisper.d.ts.map