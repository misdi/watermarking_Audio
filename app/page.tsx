import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <h1 className="text-4xl font-bold mb-8">Audio Watermarking App</h1>
      <p className="text-xl mb-8">Upload, watermark, and download your audio files</p>
      <Link href="/audio-watermark" passHref>
        <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-100">
          Get Started
        </Button>
      </Link>
    </div>
  );
}