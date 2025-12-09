# Deploying CORS Configuration

To allow your web app to upload images to Firebase Storage, you need to apply the CORS (Cross-Origin Resource Sharing) configuration.

I have created the configuration file: `cors.json`

## Option 1: Using Google Cloud Console (Recommended)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Make sure you are in the project `mcqfirebasedatabase`.
3.  Click the **Activate Cloud Shell** button (terminal icon in the top right).
4.  In the Cloud Shell terminal, run these commands:

```bash
# 1. Create the cors.json file in the shell
nano cors.json
```

5.  Paste the content below into the editor:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

6.  Press `Ctrl+O`, `Enter` to save, then `Ctrl+X` to exit.
7.  Run the deployment command:

```bash
gsutil cors set cors.json gs://mcqfirebasedatabase.firebasestorage.app
```

## Option 2: If you have gsutil installed locally

Run this in your terminal (at the project root):

```powershell
gsutil cors set cors.json gs://mcqfirebasedatabase.firebasestorage.app
```
