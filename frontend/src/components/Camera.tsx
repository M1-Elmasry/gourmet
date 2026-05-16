import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

export interface CameraHandle {
  capture: () => Promise<Blob | null>
}

interface Props {
  active: boolean
}

const Camera = forwardRef<CameraHandle, Props>(({ active }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (active) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [active])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch {
      setError('Camera access denied. Please allow camera access.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setReady(false)
  }

  useImperativeHandle(ref, () => ({
    capture: async () => {
      if (!videoRef.current || !canvasRef.current || !ready) return null
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0)
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
      })
    },
  }))

  return (
    <div className="relative w-full aspect-video bg-surface rounded-lg overflow-hidden border border-border">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-warn font-mono text-sm text-center px-4">{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Scanning line animation */}
          {ready && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60 animate-scan" />
            </div>
          )}
          {/* Corner brackets */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent" />
          </div>
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted font-mono text-xs">INITIALIZING CAMERA</p>
              </div>
            </div>
          )}
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
})

Camera.displayName = 'Camera'
export default Camera
