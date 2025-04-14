import { stream } from "./screen-share/stream"

const init = async () => {
  // @ts-ignore
  const pathToModelScript = chrome.runtime.getURL(
    "/models/@mediapipe/tasks-vision/wasm"
  )
  // @ts-ignore
  const pathToModel = chrome.runtime.getURL("/models/face_landmarker.task")

  localStorage.setItem("pathToModelScript", pathToModelScript)
  localStorage.setItem("pathToModel", pathToModel)

  const script = document.createElement("script")
  // @ts-ignore
  script.src = chrome.runtime.getURL("inject.js")
  document.body.appendChild(script)

  stream()
}

init()
