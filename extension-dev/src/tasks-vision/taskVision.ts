import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import { faceOvalIndexes } from "./faceOvalIndexes"

const dev = false

const headWidth = 640 / 1.5
const headHeight = 480 / 1.5

interface FaceLandmarkerData {
  faceLandmarker: FaceLandmarker
  canvas: HTMLCanvasElement
  video: HTMLVideoElement
  lastVideoTime: number
}

const mousePositions = {
  x: 0,
  y: 0,
}

const createFaceLandmarker = async () => {
  const canvas = createCanvas("canvas")
  document.body.appendChild(canvas)
  const video = await initWebcam()
  document.addEventListener("mousemove", (event) => {
    mousePositions.x = event.clientX
    mousePositions.y = event.clientY
  })
  return new Promise<FaceLandmarkerData>((resolve) => {
    video.addEventListener(
      "loadeddata",
      async () => {
        const faceLandmarker = await initFaceLandmarker()
        resolve({
          faceLandmarker: faceLandmarker,
          canvas: canvas,
          video: video,
          lastVideoTime: -1,
        })
      },
      { once: true }
    )
  })
}

const createCanvas = (type: "canvas" | "mask") => {
  const canvas = document.createElement("canvas")
  canvas.className = "ignore-effects"
  canvas.style.position = "fixed"
  canvas.style.top = "0px"
  canvas.style.left = "0px"
  canvas.style.zIndex = "999"
  canvas.width = headWidth
  canvas.height = headHeight
  canvas.style.pointerEvents = "none"
  if (type === "canvas") {
    canvas.style.transform = "scale(0.5)"
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
  }
  return canvas
}

const initWebcam = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true })
  const video = document.createElement("video")
  video.srcObject = stream
  video.play()
  video.width = 640
  video.height = 480
  return video
}

const initFaceLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    dev
      ? "http://localhost:3001/undnet/files/models/@mediapipe/tasks-vision/wasm"
      : localStorage.getItem("pathToModelScript") || ""
  )
  const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: dev
        ? "http://localhost:3001/undnet/files/models/face_landmarker.task"
        : localStorage.getItem("pathToModel") || "",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  })
  return faceLandmarker
}

const analyzeFace = (faceLandmarkerData: FaceLandmarkerData) => {
  const { faceLandmarker, canvas, video, lastVideoTime } = faceLandmarkerData
  if (video.currentTime === lastVideoTime) return
  const ctx = canvas.getContext("2d")
  const mask = createCanvas("mask")
  const maskCtx = mask.getContext("2d")
  if (!(ctx && maskCtx)) return

  const result = faceLandmarker.detectForVideo(video, performance.now())
  faceLandmarkerData.lastVideoTime = video.currentTime

  if (!result.faceLandmarks[0]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    return
  }
  const faceOvals = faceOvalIndexes.map((index) => {
    const flippedX = 0.5 - (result.faceLandmarks[0][index].x - 0.5)
    const x = flippedX * headWidth
    const y = result.faceLandmarks[0][index].y * headHeight
    return { x: x, y: y }
  })
  const leftMostX = Math.min(...faceOvals.map((oval) => oval.x))
  const rightMostX = Math.max(...faceOvals.map((oval) => oval.x))
  const upMostY = Math.min(...faceOvals.map((oval) => oval.y))
  const downMostY = Math.max(...faceOvals.map((oval) => oval.y))
  const xOffset = (leftMostX + rightMostX) / 2 - canvas.width / 2
  const yOffset = (upMostY + downMostY) / 2 - canvas.height / 2

  maskCtx.fillStyle = "rgba(0, 0, 0, 0)"
  maskCtx.fillRect(0, 0, mask.width, mask.height)

  maskCtx.beginPath()
  maskCtx.moveTo(faceOvals[0].x, faceOvals[0].y)
  const length = faceOvals.length
  for (let i = 1; i < length - 2; i++) {
    const x2 = (faceOvals[i].x + faceOvals[i + 1].x) / 2
    const y2 = (faceOvals[i].y + faceOvals[i + 1].y) / 2
    maskCtx.quadraticCurveTo(faceOvals[i].x, faceOvals[i].y, x2, y2)
  }
  maskCtx.quadraticCurveTo(
    faceOvals[length - 2].x,
    faceOvals[length - 2].y,
    faceOvals[length - 1].x,
    faceOvals[length - 1].y
  )
  maskCtx.closePath()
  maskCtx.fillStyle = "rgba(0, 0, 0, 255)"
  maskCtx.fill()

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height)
  for (let i = 0; i < canvasData.data.length; i += 4) {
    canvasData.data[i + 3] = maskData.data[i + 3]
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.putImageData(canvasData, 0, 0)

  const { x, y } = mousePositions
  const headOffset = 7
  canvas.style.transform = `translateX(${
    x - canvas.width / 2 - xOffset + headWidth / headOffset
  }px) translateY(${
    y - canvas.height / 2 - yOffset + headHeight / headOffset
  }px)`
}

export const faceAnalyzer = {
  create: createFaceLandmarker,
  analyze: analyzeFace,
}
