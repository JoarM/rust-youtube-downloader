// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use rusty_ytdl::Video;
use rusty_ytdl::{VideoOptions,VideoQuality,VideoSearchOptions};
use directories::UserDirs;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![video, audio])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn video(url: String, name: String) -> String {
  let video_options = VideoOptions {
    quality: VideoQuality::Highest,
    filter: VideoSearchOptions::VideoAudio,
    ..Default::default()
  };

  let video = Video::new_with_options(url, video_options).unwrap();

  let pathname = format!("{}.mp4", name);
  let path = UserDirs::new().unwrap().download_dir().unwrap().join(std::path::Path::new(&pathname));
  let path_string = format!("Downloaded to: {:?}", path.to_str());

  video.download(path).await.unwrap();
  path_string
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
  let path_string = format!("Downloaded to: {:?}", path.to_str());
  
  video.download(path).await.unwrap();
  path_string
}


