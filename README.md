# MeshyGrab

MeshyGrab is a Chrome extension that reads model cards and model file links from the active browser tab, lets you choose models and a file format, and downloads the matching files.

## Quick start

Install Chrome or Chromium, then run the launcher for your operating system from the project folder:

| Operating system | Command |
| --- | --- |
| Linux | `./run.sh` |
| macOS (Terminal) | `./run.sh` |
| macOS (Finder) | Double-click `run.command` |
| Windows PowerShell | `./run.ps1` |

The launcher opens Meshy in a separate development profile and loads the unpacked extension for that session. Sign in to Meshy in that browser window if needed. Keep using the launcher to start this development copy again.

## Manual install

1. Download or clone this project to your computer.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select the project folder.
5. Open or reload a Meshy page and sign in to Meshy there if needed.
6. To keep the extension available in your regular Chrome profile, pin it from Chrome’s Extensions menu. Loading an unpacked extension this way is intended for local development and requires Developer mode.

## Use

1. Open the Meshy page containing the models you want.
2. Click the MeshyGrab extension icon.
3. On the welcome screen, choose **Continue to Meshy** to open Meshy, or **I’m already signed in** to continue to the model list. MeshyGrab does not ask for or store your Meshy password.
4. Choose **Read all cards**. MeshyGrab scans the model cards and gathers available file links. Keep the page open while it reads.
5. Select the models to download. Preview images appear on cards when the page provides a loadable thumbnail.
6. Choose **Next**, select a file format, then click **Download**. Files are saved in the browser’s `MeshyGrab` downloads folder.

## Troubleshooting

- **No models appear:** Make sure the relevant Meshy page is active, reload it after installing or updating the extension, then choose **Read all cards** again.
- **A preview is missing:** Some cards do not provide a thumbnail, or the image host may prevent it from loading. The model name and file links can still be available.
- **No formats are listed:** The page may not have exposed downloadable model links yet. Reopen or refresh the model page and scan again.
- **The scan does not start:** Reload the Meshy page and reopen the extension. Chrome internal pages such as `chrome://extensions` do not allow content scripts to run.

## Notes

- The welcome screen is a sign-in handoff to Meshy, not a Meshy authentication system. Sign in on Meshy itself.
- MeshyGrab reads data available to the extension from browser tabs and uses Chrome downloads to save selected files.
- A launcher starts a separate development profile; it does not publish the extension or install it permanently in your everyday browser profile. For a regular local install, use **Load unpacked** above. Public Chrome distribution requires publishing through the Chrome Web Store.
- Download only models you own or have permission to use, and follow Meshy’s terms and applicable laws.
