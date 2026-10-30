import OpenAI from "openai";
import { execFile as execFileCallback } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const MAX_VIDEO_DURATION_SECONDS = 180;

export type ProcessedVideo = {
  durationSeconds: number;
  frameBase64: string[];
  transcript: string;
};

export async function convertImageToJpeg(
  imagePath: string,
  workingDirectory: string,
): Promise<Buffer> {
  const outputPath = path.join(workingDirectory, "normalized-image.jpg");
  await runTool("ffmpeg", [
    "-nostdin",
    "-v",
    "error",
    "-y",
    "-i",
    imagePath,
    "-frames:v",
    "1",
    "-vf",
    "scale=1600:-2",
    "-q:v",
    "7",
    outputPath,
  ]);
  return readFile(outputPath);
}

export async function processUploadedVideo(
  videoPath: string,
  workingDirectory: string,
): Promise<ProcessedVideo> {
  const probeOutput = await runTool("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_type",
    "-of",
    "json",
    videoPath,
  ]);

  const probe = JSON.parse(probeOutput) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string }>;
  };
  const durationSeconds = Number(probe.format?.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("The selected video could not be opened.");
  }
  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    throw new Error("Video clips must be 3 minutes or shorter.");
  }

  const frameBase64 = await extractVideoFrames(
    videoPath,
    workingDirectory,
    durationSeconds,
  );
  if (!frameBase64.length) {
    throw new Error("No readable frames could be extracted from the video.");
  }

  const hasAudio = (probe.streams ?? []).some(
    (stream) => stream.codec_type === "audio",
  );
  const transcript = hasAudio
    ? await transcribeVideoAudio(videoPath, workingDirectory)
    : "";

  return { durationSeconds, frameBase64, transcript };
}

async function extractVideoFrames(
  videoPath: string,
  workingDirectory: string,
  durationSeconds: number,
): Promise<string[]> {
  const percentages = [0.05, 0.25, 0.5, 0.75, 0.95];
  const timestamps = [
    ...new Set(
      percentages.map((percentage) =>
        Math.max(
          0,
          Math.min(durationSeconds - 0.1, durationSeconds * percentage),
        ).toFixed(2),
      ),
    ),
  ];
  const frames: string[] = [];

  for (const [index, timestamp] of timestamps.entries()) {
    const framePath = path.join(workingDirectory, `frame-${index}.jpg`);
    try {
      await runTool("ffmpeg", [
        "-nostdin",
        "-v",
        "error",
        "-y",
        "-ss",
        timestamp,
        "-i",
        videoPath,
        "-frames:v",
        "1",
        "-vf",
        "scale=512:-2",
        "-q:v",
        "7",
        framePath,
      ]);
      frames.push((await readFile(framePath)).toString("base64"));
    } catch {
      // A timestamp can land on an unreadable frame; keep other samples.
    }
  }

  return frames;
}

async function transcribeVideoAudio(
  videoPath: string,
  workingDirectory: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Video speech transcription is not configured. Add OPENAI_API_KEY in Replit Secrets.",
    );
  }

  const audioPath = path.join(workingDirectory, "audio.mp3");
  await runTool("ffmpeg", [
    "-nostdin",
    "-v",
    "error",
    "-y",
    "-i",
    videoPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "48k",
    "-f",
    "mp3",
    audioPath,
  ]);

  const client = new OpenAI({ apiKey });
  const result = await client.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: "gpt-4o-mini-transcribe",
    response_format: "json",
  });

  return result.text.trim().slice(0, 12_000);
}

async function runTool(command: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFile(command, args, {
      timeout: 45_000,
      maxBuffer: 2_000_000,
    });
    return stdout;
  } catch {
    throw new Error(
      command === "ffprobe"
        ? "The uploaded video could not be inspected."
        : "The uploaded video could not be processed.",
    );
  }
}
