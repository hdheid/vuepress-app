use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::Path;

#[derive(Serialize, Deserialize, Clone)]
struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileNode>>,
}

fn read_dir_recursive(path: &Path) -> Vec<FileNode> {
    let mut nodes = Vec::new();
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            
            // Ignore .git, node_modules, and dist/temp folders
            if name == ".git" || name == "node_modules" || name == ".temp" || name == ".cache" {
                continue;
            }

            let is_dir = path.is_dir();
            let mut node = FileNode {
                name: name.clone(),
                path: path.to_string_lossy().to_string(),
                is_dir,
                children: None,
            };

            if is_dir {
                node.children = Some(read_dir_recursive(&path));
            }
            nodes.push(node);
        }
    }
    // Sort: Directories first, then files
    nodes.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else {
            b.is_dir.cmp(&a.is_dir)
        }
    });
    nodes
}

#[tauri::command]
fn get_project_files(path: String) -> Result<Vec<FileNode>, String> {
    Ok(read_dir_recursive(Path::new(&path)))
}

#[tauri::command]
fn git_commit(path: String, message: String) -> Result<String, String> {
    // git add .
    let add_output = Command::new("git")
        .args(["add", "."])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !add_output.status.success() {
        return Err(String::from_utf8_lossy(&add_output.stderr).to_string());
    }

    // git commit -m "message"
    let commit_output = Command::new("git")
        .args(["commit", "-m", &message])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !commit_output.status.success() {
        return Err(String::from_utf8_lossy(&commit_output.stderr).to_string());
    }
    
    Ok(String::from_utf8_lossy(&commit_output.stdout).to_string())
}

#[tauri::command]
fn git_push(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .arg("push")
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
         return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_project_files, git_commit, git_push])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
