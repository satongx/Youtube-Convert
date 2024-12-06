'use client'

import { useState } from 'react'
import { FileUploader } from './components/FileUploader'
import { MP3List } from './components/MP3List'
import { Music } from 'lucide-react'

export default function ConvertPage() {
  const [mp3Files, setMp3Files] = useState<string[]>([])

  const onConversionSuccess = (fileName: string) => {
    setMp3Files(prev => [...prev, fileName])
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            YouTube to MP3 Converter
          </h1>
          <p className="text-gray-600">
            Convert your favorite YouTube videos to MP3 in seconds
          </p>
        </div>

        {/* Converter Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <FileUploader onSuccess={onConversionSuccess} />
        </div>

        {/* History Card */}
        {mp3Files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Conversion History
            </h2>
            <MP3List files={mp3Files} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Convert YouTube videos to MP3 format safely and easily</p>
      </footer>
    </main>
  )
}