// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::cmp::Ordering;
use std::sync::Arc;

use rusty_ytdl::{Video, VideoFormat, VideoInfo};
use rusty_ytdl::{VideoOptions,VideoQuality,VideoSearchOptions};
use directories::UserDirs;
use ffmpeg_cli::{FfmpegBuilder, File};
use std::fs;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![video, audio, get_video_info])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn video(url: String, name: String, itag: u64) -> Result<String, String> {
  let compare_formats = Arc::new(move |_a: &VideoFormat, b: &VideoFormat| {
    let equals = b.itag == itag;
    if equals {
      return Ordering::Greater; 
    }
    Ordering::Less
  });
  let video_options = VideoOptions {
    filter: VideoSearchOptions::Video,
    quality: VideoQuality::Custom(VideoSearchOptions::Video, compare_formats),
    ..Default::default()
  };

  let video = Video::new_with_options(&url, video_options);
  if video.is_err() {
    return Err("Failed to find video".to_string());
  }
  
  let video_dwnld = video.unwrap().download("video.mp4").await;
  if video_dwnld.is_err() {
    return Err("Failed to download video".to_string());
  }

  let audio_options = VideoOptions {
    quality: VideoQuality::Highest,
    filter: VideoSearchOptions::Audio,
    ..Default::default()
  };

  let audio = Video::new_with_options(&url, audio_options);
  if audio.is_err() {
    return Err("Failed to find video".to_string());
  }

  let audio_dwnld = audio.unwrap().download("audio.mp3").await;
  if audio_dwnld.is_err() {
    return Err("Failed to download audio".to_string());
  }

  let pathname = format!("{}.mp4", name);
  let path = UserDirs::new().unwrap().download_dir().unwrap().join(std::path::Path::new(&pathname));
  
  let output = combine_mp4_and_mp3("video.mp4", "audio.mp3", &path.to_str().unwrap()).await;
  if output.is_err() {
    return Err("Failed to combine video and audio stream".to_string());
  }
  
  let path_string = format!("Downloaded to: {:?}", output.unwrap());
  let _ = fs::remove_file("video.mp4");
  let _ = fs::remove_file("audio.mp3");

  Ok(path_string)
}

#[tauri::command]
async fn audio(url: String, name: String) -> String {
  let video_options = VideoOptions {
    quality: VideoQuality::Highest,
    filter: VideoSearchOptions::Audio,
    ..Default::default()
  };

  let video = Video::new_with_options(url, video_options).unwrap();

  let pathname = format!("{}.mp3", name);
  let path = UserDirs::new().unwrap().download_dir().unwrap().join(std::path::Path::new(&pathname));
  let path_string = format!("Downloaded to: {:?}", path.to_str().unwrap());
  
  video.download(path).await.unwrap();
  path_string
}

#[tauri::command]
async fn get_video_info(url: String) -> Result<VideoInfo, String> {
  let raw_video = Video::new(url);
  let video_is_err = raw_video.is_err();
  if video_is_err {
    let video_error = raw_video.unwrap_err();
    
    return Err(video_error.to_string());
  }
  let video = raw_video.unwrap();
  Ok(video.get_info().await.unwrap())
}

async fn combine_mp4_and_mp3(mp4_path: &str, mp3_path: &str, output_path: &str) -> Result<String, ()> {
  let builder = FfmpegBuilder::new().input(File::new(mp4_path)).input(File::new(mp3_path)).output(File::new(output_path));
  let ffmpeg = builder.run().await;
  if ffmpeg.is_err() {
    return Err(());
  }
  let output = ffmpeg.unwrap().process.wait_with_output();
  if output.is_err() {
    return Err(());
  }
  Ok(output_path.to_string())
}