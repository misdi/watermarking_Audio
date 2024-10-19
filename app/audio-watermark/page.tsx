'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Music, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AudioWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkedAudio, setWatermarkedAudio] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const applyWatermark = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProgress(10);
      const context = new (window.AudioContext || window.webkitAudioContext)();
      
      setProgress(30);
      const [audioBuffer, watermarkBuffer] = await Promise.all([
        loadAudioBuffer(file, context),
        loadWatermarkBuffer(context)
      ]);

      setProgress(50);
      const outputBuffer = context.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const audioData = audioBuffer.getChannelData(channel);
        const watermarkData = watermarkBuffer.getChannelData(channel % watermarkBuffer.numberOfChannels);
        const outputData = outputBuffer.getChannelData(channel);

        for (let i = 0; i < outputBuffer.length; i++) {
          outputData[i] = audioData[i] + 0.1 * watermarkData[i % watermarkBuffer.length];
        }
      }

      setProgress(80);
      const wavBlob = bufferToWave(outputBuffer, outputBuffer.length);
      const url = URL.createObjectURL(wavBlob);
      setWatermarkedAudio(url);

      setProgress(100);
      toast({
        title: "Success",
        description: "Watermark applied successfully!",
      });
    } catch (error) {
      console.error("Error applying watermark:", error);
      toast({
        title: "Error",
        description: "Failed to apply watermark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProgress(0);
    }
  };

  const loadWatermarkBuffer = async (context: AudioContext): Promise<AudioBuffer> => {
    const response = await fetch('/watermarks_default.wav');
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
  };

  const loadAudioBuffer = async (file: File, context: AudioContext): Promise<AudioBuffer> => {
    const arrayBuffer = await file.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
  };

  const bufferToWave = (abuffer: AudioBuffer, len: number): Blob => {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(len * numOfChan * 2);

    for (let i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while (pos < len) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
      pos++;
    }

    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audio Watermarking</h1>
      <div className="mb-4">
        <Label htmlFor="audio-file">Upload Audio File</Label>
        <Input id="audio-file" type="file" accept="audio/*" onChange={handleFileChange} />
      </div>
      <Button onClick={applyWatermark} disabled={!file}>
        <Upload className="mr-2 h-4 w-4" /> Apply Watermark
      </Button>
      {progress > 0 && progress < 100 && (
        <Progress value={progress} className="mt-4" />
      )}
      {watermarkedAudio && (
        <div className="mt-4">
          <audio ref={audioRef} controls src={watermarkedAudio} />
          <Button asChild className="mt-2">
            <a href={watermarkedAudio} download="watermarked_audio.wav">
              <Download className="mr-2 h-4 w-4" /> Download Watermarked Audio
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}