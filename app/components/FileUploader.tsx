'use client'

import { useState } from 'react'
import { Link, Download } from 'lucide-react'

export function FileUploader({ onSuccess }: { onSuccess: (fileName: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [status, setStatus] = useState<string>('')
  const [videoTitle, setVideoTitle] = useState<string>('')

  const pollProgress = async () => {
    if (!isUploading) return
    
    try {
      const response = await fetch('/api/progress')
      const data = await response.json()
      setProgress(data.progress)
      setStatus(data.status)
      
      if (data.status !== 'Complete!') {
        setTimeout(pollProgress, 1000)
      }
    } catch (error) {
      console.error('Error polling progress:', error)
    }
  }

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl.trim()) return

    setIsUploading(true)
    setProgress(0)
    setStatus('Starting...')
    setDownloadUrl(null)

    try {
      // Start polling progress
      pollProgress()

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          youtubeUrl: youtubeUrl.trim() 
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Conversion failed')
      }

      // Get filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition')
      const filename = disposition?.split('filename=')[1]?.replace(/"/g, '') || 'audio.mp3'
      setVideoTitle(filename)

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setDownloadUrl(url)
      onSuccess(filename)
      setStatus('Complete!')
      setProgress(100)
    } catch (error) {
      console.error('Conversion failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to convert video')
      setStatus('Failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = () => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = videoTitle || 'converted.mp3'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(downloadUrl)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleYoutubeSubmit} className="flex gap-2">
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="Paste YouTube URL here"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUploading}
        />
        <button
          type="submit"
          disabled={isUploading || !youtubeUrl.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Link className="w-5 h-5" />
        </button>
      </form>

      {isUploading && (
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            {status} ({progress}%)
          </div>
          <div className="w-full max-w-md mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {downloadUrl && (
        <div className="flex justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Download className="w-5 h-5" />
            Download MP3
          </button>
        </div>
      )}
    </div>
  )
} 