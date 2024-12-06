import { NextResponse } from 'next/server'
import { writeFile, unlink, readFile, mkdir } from 'fs/promises'
import { stream, video_info } from 'play-dl'
import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import { updateProgress } from '@/app/lib/progress'

export async function POST(request: Request) {
  try {
    const { youtubeUrl } = await request.json()
    
    if (!youtubeUrl) {
      return NextResponse.json({ error: 'No YouTube URL provided' }, { status: 400 })
    }

    // Create directory
    const uploadDir = join(process.cwd(), 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const inputPath = join(uploadDir, `input-${timestamp}.mp4`)
    const outputPath = join(uploadDir, `output-${timestamp}.mp3`)

    // Get video info
    const videoInfo = await video_info(youtubeUrl)
    
    // Download
    updateProgress(0, 'Starting download...')
    const audioStream = await stream(youtubeUrl, { 
      quality: 2,
      discordPlayerCompatibility: true
    })

    const writeStream = require('fs').createWriteStream(inputPath)
    
    await new Promise((resolve, reject) => {
      audioStream.stream.pipe(writeStream)
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })

    // Convert
    updateProgress(50, 'Converting...')
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate('128k')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath)
    })

    updateProgress(100, 'Complete!')

    // Read the file
    const audioBuffer = await readFile(outputPath)

    // Cleanup
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ])

    const filename = (videoInfo.video_details.title ?? 'audio')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}.mp3"`
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Conversion failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 