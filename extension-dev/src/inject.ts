import { faceAnalyzer } from "./tasks-vision/taskVision"

const initModels = async () => {
  const faceData = await faceAnalyzer.create()
  if (!faceData) return
  const analyzeFace = async () => {
    faceAnalyzer.analyze(faceData)
    requestAnimationFrame(analyzeFace)
  }
  analyzeFace()
}

initModels()
