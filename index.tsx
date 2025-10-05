import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';

const LOADING_MESSAGES = [
  "جاري تحليل النص...",
  "بناء القصة المصورة...",
  "توليد المشاهد الأولية...",
  "إنشاء التعليق الصوتي...",
  "إضافة اللمسات السينمائية...",
  "لحظات وينتهي الفيديو!",
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });


const App = () => {
  const [script, setScript] = useState('');
  const [style, setStyle] = useState('سينمائي');
  const [voice, setVoice] = useState('فصحى');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(15);
  const [videoLengthType, setVideoLengthType] = useState<'short' | 'long'>('short');
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const loadingIntervalRef = useRef<number | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = LOADING_MESSAGES.indexOf(prev);
          const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
          return LOADING_MESSAGES[nextIndex];
        });
      }, 3000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
      setLoadingMessage(LOADING_MESSAGES[0]);
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading]);
  
  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
    };
  }, [audioUrl]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
    }
    e.target.value = ''; // Allow re-selecting the same file
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioUrl) {
          URL.revokeObjectURL(audioUrl); 
      }
      setAudioFile(file);
      const newUrl = URL.createObjectURL(file);
      setAudioUrl(newUrl);
    }
    e.target.value = ''; // Allow re-selecting the same file
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageBase64(null);
  };
  
  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
  };

  const handleGenerateVideo = async () => {
    if (!script.trim() && !imageFile) {
      setError("الرجاء إدخال نص أو رفع صورة لإنشاء الفيديو.");
      return;
    }
    setIsLoading(true);
    setVideoUrl(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const finalDuration = videoLengthType === 'long' ? 60 : duration;
      const lengthPrompt = videoLengthType === 'long'
        ? `أنشئ فيديو طويل ومفصل`
        : `أنشئ فيديو قصير`;
      
      let promptContext = '';
      if (imageBase64) {
        promptContext += 'بناءً على الصورة المرفقة، ';
      }
      if (audioFile) {
         promptContext += `قم بإنشاء فيديو صامت ليتناسب مع الصوت المرفق. `;
      }

      const voicePrompt = audioFile ? '' : `مع تعليق صوتي باللهجة ${voice}`;

      const fullPrompt = `${promptContext}${lengthPrompt} بأسلوب ${style} ${voicePrompt} مدته ${finalDuration} ثانية. النص: "${script}"`;
      
      const request: any = {
        model: 'veo-2.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfVideos: 1,
          durationInSeconds: finalDuration,
        }
      };

      if (imageBase64 && imageFile) {
        request.image = {
          imageBytes: imageBase64.split(',')[1],
          mimeType: imageFile.type,
        };
      }

      let operation = await ai.models.generateVideos(request);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await response.blob();
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
      } else {
        throw new Error("لم يتمكن الذكاء الاصطناعي من إنشاء الفيديو. حاول مرة أخرى.");
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container" aria-live="polite">
          <div className="spinner"></div>
          <p className="loading-text">{loadingMessage}</p>
        </div>
      );
    }

    if (videoUrl) {
      return (
        <div className="video-container">
          <video src={videoUrl} controls autoPlay muted={!!audioUrl} loop playsInline></video>
          {audioUrl && (
            <div className="audio-player-wrapper">
              <p>الصوت المرفق:</p>
              <audio src={audioUrl} controls autoPlay></audio>
            </div>
          )}
          <a
            href={videoUrl}
            download="ai_video.mp4"
            className="primary-button download-button"
            aria-label="تحميل الفيديو"
          >
            تحميل الفيديو
          </a>
          {audioUrl && <p className="info-text">ملاحظة: سيتم تحميل الفيديو بدون الصوت المرفق.</p>}
        </div>
      );
    }

    if (error) {
      return <div className="placeholder"><p style={{color: '#ff4d4d'}}>{error}</p></div>;
    }

    return (
      <div className="placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
        </svg>
        <h2>منطقة العرض</h2>
        <p>سيظهر الفيديو الذي تم إنشاؤه هنا.</p>
      </div>
    );
  };

  return (
    <>
      <header>
        <h1>فيديو بالذكاء الاصطناعي</h1>
      </header>
      <main>
        <div className="controls-panel">
          <div className="form-group">
            <label htmlFor="script-input">اكتب النص هنا (أو ارفع صورة)</label>
            <textarea
              id="script-input"
              placeholder="مثال: قطة صغيرة تلعب بكرة من الصوف في حديقة مشمسة..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              disabled={isLoading}
              aria-required="true"
            />
          </div>
           <div className="form-group upload-group">
              <label>إضافة وسائط (اختياري)</label>
              <div className="file-input-container">
                <div className="file-input-wrapper">
                  <label htmlFor="image-upload" className="upload-button">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /> </svg>
                    <span>رفع صورة</span>
                  </label>
                  <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} disabled={isLoading} />
                </div>
                <div className="file-input-wrapper">
                  <label htmlFor="audio-upload" className="upload-button">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /> </svg>
                    <span>رفع صوت</span>
                  </label>
                  <input id="audio-upload" type="file" accept="audio/*" onChange={handleAudioChange} disabled={isLoading} />
                </div>
              </div>
              {imageFile && (
                <div className="file-info">
                  <span>{imageFile.name}</span>
                  <button onClick={handleRemoveImage} className="remove-file-button" aria-label="إزالة الصورة">&times;</button>
                </div>
              )}
              {audioFile && (
                <div className="file-info">
                  <span>{audioFile.name}</span>
                  <button onClick={handleRemoveAudio} className="remove-file-button" aria-label="إزالة الصوت">&times;</button>
                </div>
              )}
            </div>
          <div className="form-group">
            <label htmlFor="style-select">نمط الفيديو</label>
            <select id="style-select" value={style} onChange={(e) => setStyle(e.target.value)} disabled={isLoading}>
              <option>سينمائي</option>
              <option>كوميدي</option>
              <option>تعليمي</option>
              <option>وثائقي</option>
              <option>إعلاني</option>
            </select>
          </div>
           <div className="form-group">
            <label>نوع الفيديو</label>
            <div className="video-length-control">
              <button 
                className={videoLengthType === 'short' ? 'active' : ''}
                onClick={() => setVideoLengthType('short')}
                disabled={isLoading}
              >
                قصير
              </button>
              <button
                className={videoLengthType === 'long' ? 'active' : ''}
                onClick={() => setVideoLengthType('long')}
                disabled={isLoading}
              >
                طويل
              </button>
            </div>
          </div>
          {videoLengthType === 'short' && (
            <div className="form-group">
              <label htmlFor="duration-slider">مدة الفيديو (بالثواني): {duration} ثانية</label>
              <input
                type="range"
                id="duration-slider"
                min="1"
                max="60"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={isLoading}
                className="slider"
                aria-label={`مدة الفيديو ${duration} ثانية`}
              />
              <div className="slider-labels">
                <span>1 ث</span>
                <span>60 ث</span>
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="aspect-ratio-select">أبعاد الفيديو</label>
            <select id="aspect-ratio-select" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} disabled={isLoading}>
              <option value="16:9">يوتيوب (16:9)</option>
              <option value="9:16">انستغرام/تيك توك (9:16)</option>
              <option value="1:1">مربع (1:1)</option>
            </select>
          </div>
           <div className="form-group">
            <label htmlFor="voice-select">لهجة التعليق الصوتي</label>
            <select id="voice-select" value={voice} onChange={(e) => setVoice(e.target.value)} disabled={isLoading || !!audioFile}>
              <option>فصحى</option>
              <option>سعودي</option>
              <option>مصري</option>
              <option>شامي</option>
            </select>
             {audioFile && <small className="info-text">تم تعطيل التعليق الصوتي بسبب رفع ملف صوتي.</small>}
          </div>
          <button className="primary-button" onClick={handleGenerateVideo} disabled={isLoading}>
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء الفيديو'}
          </button>
        </div>
        <div className="preview-panel" aria-live="polite">
          {renderPreviewContent()}
        </div>
      </main>
    </>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);