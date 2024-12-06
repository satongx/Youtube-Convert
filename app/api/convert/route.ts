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

    const videoInfo = await ytdl.getBasicInfo(youtubeUrl)
    const sanitizedTitle = videoInfo.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()

    const inputPath = join('/tmp', `youtube-${Date.now()}.mp4`)
    const outputPath = join('/tmp', `${sanitizedTitle}.mp3`)

    // Download with progress
    await new Promise((resolve, reject) => {
      ytdl(youtubeUrl, {
        quality: 'lowestaudio',
        filter: 'audioonly'
      })
        .on('progress', (_, downloaded, total) => {
          const progress = Math.floor((downloaded / total) * 100)
          updateProgress(progress, 'Downloading...')
        })
        .pipe(require('fs').createWriteStream(inputPath))
        .on('finish', resolve)
        .on('error', reject)
    })

    // Convert with progress
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate(128)
        .on('progress', (progress) => {
          const percent = Math.floor(progress.percent || 0)
          updateProgress(percent, 'Converting...')
        })
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath)
    })

    const audioBuffer = await readFile(outputPath)

    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ])

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp3"`
      }
    })
  } catch (error) {
    console.error('Conversion error:', error)
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 })
  }
} 