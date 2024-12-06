import { NextResponse } from 'next/server'
import { writeFile, unlink, readFile } from 'fs/promises'
import ytdl from 'ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import { updateProgress } from '@/app/lib/progress'

export async function POST(request: Request) {
  try {
    const { youtubeUrl } = await request.json()
    if (!youtubeUrl) {
      return NextResponse.json({ error: 'No YouTube URL provided' }, { status: 400 })
    }

    console.log('Starting conversion for:', youtubeUrl)
    updateProgress(0, 'Getting video info...')

    // Validate YouTube URL
    if (!ytdl.validateURL(youtubeUrl)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const videoInfo = await ytdl.getBasicInfo(youtubeUrl)
    const sanitizedTitle = videoInfo.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()

    const inputPath = join('/tmp', `youtube-${Date.now()}.mp4`)
    const outputPath = join('/tmp', `${sanitizedTitle}.mp3`)

    console.log('Downloading to:', inputPath)
    updateProgress(0, 'Starting download...')

    // Download with progress
    await new Promise((resolve, reject) => {
      ytdl(youtubeUrl, {
        quality: 'lowestaudio',
        filter: 'audioonly'
      })
        .on('progress', (_, downloaded, total) => {
          const progress = Math.floor((downloaded / total) * 100)
          console.log(`Download progress: ${progress}%`)
          updateProgress(progress, 'Downloading...')
        })
        .on('error', (error) => {
          console.error('Download error:', error)
          reject(error)
        })
        .pipe(require('fs').createWriteStream(inputPath))
        .on('finish', () => {
          console.log('Download completed')
          resolve(null)
        })
        .on('error', (error: Error) => {
          console.error('File write error:', error)
          reject(error)
        })
    })

    console.log('Converting to MP3...')
    updateProgress(0, 'Starting conversion...')

    // Convert with progress
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate(128)
        .on('progress', (progress) => {
          const percent = Math.floor(progress.percent || 0)
          console.log(`Conversion progress: ${percent}%`)
          updateProgress(percent, 'Converting...')
        })
        .on('end', () => {
          console.log('Conversion completed')
          resolve(null)
        })
        .on('error', (error) => {
          console.error('Conversion error:', error)
          reject(error)
        })
        .save(outputPath)
    })

    console.log('Reading converted file...')
    const audioBuffer = await readFile(outputPath)

    console.log('Cleaning up temporary files...')
    await Promise.all([
      unlink(inputPath).catch((error) => console.error('Error deleting input file:', error)),
      unlink(outputPath).catch((error) => console.error('Error deleting output file:', error))
    ])

    console.log('Sending response...')
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp3"`
      }
    })
  } catch (error) {
    console.error('Conversion error details:', error)
    return NextResponse.json({ 
      error: 'Conversion failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 