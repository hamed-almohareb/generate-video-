<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Video Generator

This web application allows you to generate videos using AI. You can provide a script, an image, or both to create a unique video with various customization options.

View your app in AI Studio: https://ai.studio/apps/drive/1Ztk3_fB-jJw5PRTSjLGj3G67_7rQQpTN

## Features

*   **Text-to-Video**: Generate a video from a text script.
*   **Image-to-Video**: Generate a video based on an uploaded image.
*   **Customization**:
    *   **Video Style**: Choose from cinematic, comedy, educational, documentary, or advertising styles.
    *   **Video Length**: Select between short (1-60 seconds) or long (60 seconds) videos.
    *   **Aspect Ratio**: Choose between YouTube (16:9), Instagram/TikTok (9:16), or square (1:1).
    *   **Voiceover**: Select from a variety of voiceover languages and dialects.
*   **Audio Upload**: Upload your own audio to be used in the video.

## Run Locally

**Prerequisites:** Node.js

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repository.git
    cd your-repository
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up your environment variables:**
    Create a file named `.env.local` in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
4.  **Run the app:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## How to Use

1.  **Enter a script**: Type or paste your video script into the text area.
2.  **Upload an image (optional)**: Click "Upload Image" to select an image file.
3.  **Upload audio (optional)**: Click "Upload Audio" to select an audio file.
4.  **Customize your video**:
    *   Select the desired video style, length, aspect ratio, and voiceover.
5.  **Generate the video**: Click "Generate Video" and wait for the AI to create your video.
6.  **Preview and download**: The generated video will appear in the preview panel. You can watch it, and if you're satisfied, click "Download Video" to save it.
