import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Plus, CheckCircle, Camera, Mic, Video, Square, Play, Pause } from "lucide-react";
import { uploadDump, categories } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface UploadFormProps {
  onSuccess?: () => void;
}

const UploadForm = ({ onSuccess }: UploadFormProps) => {
  const [dumpType, setDumpType] = useState<'text' | 'image' | 'voice' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { toast } = useToast();

  // Media capture states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      // Auto-detect type based on file
      if (file.type.startsWith('image/')) {
        setDumpType('image');
      } else if (file.type.startsWith('audio/')) {
        setDumpType('voice');
      } else if (file.type.startsWith('video/')) {
        setDumpType('video');
      }
    }
  };

  // Start camera for photo capture
  // REPLACE ALL CAMERA-RELATED FUNCTIONS WITH THESE:

  // Start camera for photo capture
  const startCamera = async () => {
    try {
      console.log('Starting camera...');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Stream obtained:', stream);
      setMediaStream(stream);
      setShowCamera(true);

      // Wait for next tick to ensure video element is in DOM
      setTimeout(() => {
        if (videoRef.current && stream) {
          console.log('Setting up video element');
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => console.log('Video playing'))
                .catch(err => console.error('Play failed:', err));
            }
          };
        }
      }, 100);

    } catch (error) {
      console.error('Camera error:', error);
      let errorMessage = "Camera access failed: ";

      switch (error.name) {
        case 'NotAllowedError':
          errorMessage += "Permission denied. Please allow camera access.";
          break;
        case 'NotFoundError':
          errorMessage += "No camera found.";
          break;
        case 'NotReadableError':
          errorMessage += "Camera is busy or hardware error.";
          break;
        default:
          errorMessage += error.message || "Unknown error.";
      }

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    console.log('Capturing photo...');

    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Check if video is actually playing
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.error('Video not ready');
      toast({
        title: "Error",
        description: "Camera not ready. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    const context = canvas.getContext('2d');

    // Set canvas size to video size
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    console.log('Canvas size:', canvas.width, canvas.height);

    if (context) {
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob and create file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFile(file);
          setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
          stopCamera();
          console.log('Photo captured successfully');
        } else {
          console.error('Failed to create blob');
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // Stop camera
  const stopCamera = () => {
    console.log('Stopping camera...');

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      setMediaStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setShowCamera(false);
  };

  // Start audio recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'recorded-audio.webm', { type: 'audio/webm' });
        setFile(file);
        setRecordedChunks([]);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Start video recording
  // helper: pick a supported MediaRecorder mimeType (try VP8/VP9)
  const getSupportedVideoMimeType = () => {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4' // rarely supported by MediaRecorder
    ];
    for (const c of candidates) {
      if ((window as any).MediaRecorder && (window as any).MediaRecorder.isTypeSupported && (window as any).MediaRecorder.isTypeSupported(c)) {
        return c;
      }
    }
    return undefined;
  };

  const startVideoRecording = async () => {
    try {
      // request camera + mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });

      console.log('got stream', stream);
      // quick check: ensure there's a video track
      const videoTracks = stream.getVideoTracks();
      console.log('videoTracks', videoTracks);
      if (!videoTracks || videoTracks.length === 0) {
        toast({
          title: "Camera Error",
          description: "No video track available. Please check your camera.",
          variant: "destructive",
        });
        // still attach audio if you want, but exit for video recording
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      setMediaStream(stream);
      setShowCamera(true);

      // ensure video element is ready in the DOM, then attach stream and play
      // small timeout or use requestAnimationFrame to wait for render
      setTimeout(() => {
        if (!videoRef.current) {
          console.warn('videoRef not ready yet');
          return;
        }
        videoRef.current.srcObject = stream;

        // optional: make sure the element will render the right aspect
        videoRef.current.playsInline = true;
        // listen for metadata then play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => console.log('video element playing'))
            .catch(err => console.warn('video play() failed', err));
        };

        // If loadedmetadata already happened, try play immediately
        if (videoRef.current.readyState >= HTMLMediaElement.HAVE_METADATA) {
          videoRef.current.play().catch(err => console.warn('play failed', err));
        }
      }, 50);

      // create recorder with a supported mimeType
      const mimeType = getSupportedVideoMimeType();
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch (e) {
        console.warn('MediaRecorder constructor failed, trying without options', e);
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });
        const file = new File([blob], `recorded-video-${Date.now()}.webm`, { type: blob.type });
        setFile(file);
        setRecordedChunks([]); // you can also setRecordedChunks(chunks)
        // keep stopCamera behavior: stop showing camera and stop tracks
        stopCamera();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('startVideoRecording error:', err);
      toast({
        title: "Camera/Microphone Error",
        description: err?.message || "Could not access camera or microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setIsRecording(false);
    setRecordingTime(0);
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    // Validation
    if (dumpType === 'text' && !textContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text for your dump.",
        variant: "destructive",
        duration: 3000,
      });
      setIsSubmitting(false);
      return;
    }

    if ((dumpType === 'image' || dumpType === 'voice' || dumpType === 'video') && !file) {
      toast({
        title: "Error",
        description: "Please select a file or capture media.",
        variant: "destructive",
        duration: 3000,
      });
      setIsSubmitting(false);
      return;
    }

    if (selectedTags.length === 0) {
      toast({
        title: "Tip",
        description: "Consider adding at least one tag to help others find your dump!",
        duration: 3000,
      });
    }

    try {
      const dumpData = {
        type: dumpType,
        content: dumpType === 'text' ? textContent : URL.createObjectURL(file!),
        tags: selectedTags,
        file: dumpType !== 'text' ? file || undefined : undefined,
        title: dumpType !== 'text' && title.trim() ? title.trim() : undefined,
      };

      const result = await uploadDump(dumpData);

      if (result.success) {
        setSubmitSuccess(true);
        toast({
          title: "🎉 Dump submitted successfully!",
          description: "Your anonymous dump has been shared with the community.",
          duration: 4000,
        });

        // Reset form
        setTextContent('');
        setTitle('');
        setSelectedTags([]);
        setFile(null);
        setDumpType('text');
        setCapturedPhoto(null);

        // Call success callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        toast({
          title: "Failed to submit dump",
          description: result.message || "Something went wrong. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto shadow-lg transition-all duration-300 ${submitSuccess ? 'ring-2 ring-green-500 bg-green-50' : ''
      }`}>
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          {submitSuccess && <CheckCircle className="w-6 h-6 text-green-600" />}
          Submit Your Anonymous Dump
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">What type of dump is this?</Label>
            <div className="flex gap-3">
              {(['text', 'image', 'voice', 'video'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={dumpType === type ? 'default' : 'outline'}
                  onClick={() => setDumpType(type)}
                  className="capitalize flex-1"
                >
                  {type === 'voice' ? 'Audio' : type === 'video' ? 'Video' : type}
                </Button>
              ))}
            </div>
          </div>

          {/* Universal Title Input - for all types except text */}
          {dumpType !== 'text' && (
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder={`Add a title for your ${dumpType === 'voice' ? 'audio' : dumpType}...`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <div className="text-sm text-muted-foreground text-right">
                {title.length}/100 characters
              </div>
            </div>
          )}

          {/* Content Input */}
          {dumpType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="content">Your Dump</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts, feelings, or random observations..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-32 resize-none"
                maxLength={500}
              />
              <div className="text-sm text-muted-foreground text-right">
                {textContent.length}/500 characters
              </div>
            </div>
          )}

          {/* Image Upload/Capture */}
          {dumpType === 'image' && (
            <div className="space-y-4">
              <Label>Upload Image/GIF or Take Photo</Label>

              {/* Image Title Input */}


              {/* Camera View */}
              {showCamera && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-64 rounded-lg bg-black"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button type="button" onClick={capturePhoto} className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Capture Photo
                    </Button>
                    <Button type="button" variant="outline" onClick={stopCamera}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Captured Photo Preview */}
              {capturedPhoto && !showCamera && (
                <div className="space-y-2">
                  <img src={capturedPhoto} alt="Captured" className="w-full max-h-64 object-cover rounded-lg" />
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setCapturedPhoto(null);
                    setFile(null);
                  }}>
                    Retake Photo
                  </Button>
                </div>
              )}

              {/* Upload or Camera Options */}
              {!showCamera && !capturedPhoto && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {file ? (
                      <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <span className="text-sm font-medium">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <Input
                          id="file"
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <Label
                          htmlFor="file"
                          className="cursor-pointer text-primary hover:text-primary/80"
                        >
                          Click to upload or drag and drop
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <Button type="button" variant="outline" onClick={startCamera} className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Use Camera
                    </Button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Audio Upload/Record */}
          {dumpType === 'voice' && (
            <div className="space-y-4">
              <Label>Upload Audio File or Record</Label>

              {/* Recording Interface */}
              {isRecording && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-medium">Recording...</span>
                  </div>
                  <div className="text-2xl font-mono text-red-700 mb-3">
                    {formatTime(recordingTime)}
                  </div>
                  <Button type="button" onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    Stop Recording
                  </Button>
                </div>
              )}

              {/* Upload or Record Options */}
              {!isRecording && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {file ? (
                      <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <span className="text-sm font-medium">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <Input
                          id="audioFile"
                          type="file"
                          onChange={handleFileChange}
                          accept="audio/*"
                          className="hidden"
                        />
                        <Label
                          htmlFor="audioFile"
                          className="cursor-pointer text-primary hover:text-primary/80"
                        >
                          Click to upload audio file
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP3, WAV up to 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <Button type="button" variant="outline" onClick={startAudioRecording} className="flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Record Audio
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video Upload/Record */}
          {dumpType === 'video' && (
            <div className="space-y-4">
              <Label>Upload Video File or Record</Label>

              {/* Recording Interface */}
              {/* Recording Interface */}
              {isRecording && dumpType === 'video' && (
                <div className="space-y-3">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-h-64 rounded-lg bg-black"
                    />
                    {/* Recording overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      REC {formatTime(recordingTime)}
                    </div>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button
                      type="button"
                      onClick={stopRecording}
                      variant="destructive"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Stop Recording
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload or Record Options */}
              {!isRecording && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {file ? (
                      <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <span className="text-sm font-medium">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <Input
                          id="videoFile"
                          type="file"
                          onChange={handleFileChange}
                          accept="video/*"
                          className="hidden"
                        />
                        <Label
                          htmlFor="videoFile"
                          className="cursor-pointer text-primary hover:text-primary/80"
                        >
                          Click to upload video file
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP4, MOV up to 50MB
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <Button type="button" variant="outline" onClick={startVideoRecording} className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Record Video
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Tags (optional) - Select up to 3
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 9).map((category) => (
                <Badge
                  key={category.name}
                  variant={selectedTags.includes(category.name.toLowerCase()) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => selectedTags.length < 3 || selectedTags.includes(category.name.toLowerCase()) ?
                    handleTagToggle(category.name.toLowerCase()) : null
                  }
                >
                  {selectedTags.includes(category.name.toLowerCase()) ? (
                    <X className="w-3 h-3 mr-1" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  {category.name}
                </Badge>
              ))}
            </div>
            {selectedTags.length > 2 && (
              <p className="text-sm text-muted-foreground">
                Maximum 3 tags selected
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            onClick={handleSubmit}
            className={`w-full transition-all duration-300 ${submitSuccess ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
            size="lg"
            disabled={isSubmitting || isRecording}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </div>
            ) : submitSuccess ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Submitted Successfully!
              </div>
            ) : (
              "Submit Dump Anonymously"
            )}
          </Button>

          {submitSuccess && (
            <div className="text-center text-green-600 text-sm">
              Your dump has been shared anonymously with the community! 🎉
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadForm;