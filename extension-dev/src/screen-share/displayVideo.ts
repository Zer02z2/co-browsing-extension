import { PeerUser, SelfUser } from "./stream"

// @ts-ignore
const drawBoarder = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: {
    //@ts-ignore
    name?: string
    color?: string
    borderWidth?: number
    textColor?: string
  }
) => {
  const color = options && options.color ? options.color : "rgb(112, 255, 169)"
  const textColor =
    options && options.textColor ? options.textColor : "rgb(0,0,0)"

  ctx.strokeStyle = color
  ctx.lineWidth = options && options.borderWidth ? options.borderWidth : 4
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.stroke()
  ctx.fillStyle = color

  if (options && options.name) {
    //@ts-ignore
    const resultText = options.name.split("").filter((char, index) => {
      return index <= 10
    })
    const name =
      options.name.length === resultText.length
        ? options.name
        : resultText.join("") + "..."
    ctx.beginPath()
    ctx.roundRect(x, y, w * 0.6, h * 0.1, [0, 0, 5, 0])
    ctx.fill()

    ctx.fillStyle = textColor
    ctx.textBaseline = "middle"
    ctx.font = "bold 20px Helvetica"
    ctx.fillText(name, x + w * 0.1, y + h * 0.05)

    ctx.beginPath()
    ctx.arc(x + w * 0.03, y + h * 0.05, w * 0.01, 0, 2 * Math.PI)
    ctx.fill()
  }
}

//@ts-ignore
const drawShadow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  //@ts-ignore
  options?: {
    //@ts-ignore
    name?: string
    color?: string
  }
) => {
  ctx.shadowColor = "rgba(0, 0, 0, 5)"
  ctx.fillStyle = "rgb(0, 0, 0)"
  ctx.shadowBlur = 150
  const repeats = 1
  for (let i = 0; i < repeats; i++) {
    ctx.shadowBlur += 50
    ctx.fillRect(x, y, w, h)
  }
  ctx.clearRect(x, y, w, h)
}

export const displayVideo = (self: SelfUser, currentPeers: PeerUser[]) => {
  const size = 0.06
  const dpr = window.devicePixelRatio || 1
  const myCanvas = self.local.canvas
  myCanvas.width = window.innerWidth * dpr
  myCanvas.height = window.innerHeight * dpr
  const myMouseX = self.shared.mouseX * dpr
  const myMouseY = self.shared.mouseY * dpr
  const myOuterRange = myCanvas.width * size * 1.25
  const borderWidth = 4

  currentPeers.forEach((peer) => {
    const canvas = peer.canvas
    const video = peer.video
    const ctx = canvas.getContext("2d")
    if (!(ctx && video && peer.mouseX && peer.mouseY)) return
    canvas.width = video.videoWidth * dpr
    canvas.height = video.videoHeight * dpr
    if (canvas.width <= 0 || canvas.height <= 0) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const mouseX = (canvas.width * peer.mouseX) / peer.videoW
    const mouseY = (canvas.height * peer.mouseY) / peer.videoH
    const innerRange = canvas.width * size
    const outerRange = innerRange * 1.25

    const imageData = ctx.getImageData(
      mouseX - outerRange,
      mouseY - outerRange,
      outerRange * 2,
      outerRange * 2
    )

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.putImageData(imageData, mouseX - outerRange, mouseY - outerRange)
    drawBoarder(
      ctx,
      mouseX - outerRange,
      mouseY - outerRange,
      outerRange * 2,
      outerRange * 2,
      {
        color: peer.color,
        borderWidth: borderWidth,
      }
    )
    // drawShadow(
    //   ctx,
    //   mouseX - outerRange,
    //   mouseY - outerRange,
    //   outerRange * 2,
    //   outerRange * 2,
    //   {
    //     name: peer.name,
    //   }
    // )
    // ctx.putImageData(imageData, mouseX - outerRange, mouseY - outerRange)

    ctx.clearRect(
      (myMouseX / myCanvas.width) * canvas.width -
        (myOuterRange / myCanvas.width) * canvas.width -
        borderWidth / 2,
      (myMouseY / myCanvas.height) * canvas.height -
        (myOuterRange / myCanvas.height) * canvas.height -
        borderWidth / 2,
      (myOuterRange / myCanvas.width) * canvas.width * 2 + borderWidth,
      (myOuterRange / myCanvas.height) * canvas.height * 2 + borderWidth
    )
  })

  const myCtx = myCanvas.getContext("2d")
  if (myCtx) {
    myCtx.clearRect(0, 0, myCanvas.width, myCanvas.height)
    drawBoarder(
      myCtx,
      myMouseX - myOuterRange,
      myMouseY - myOuterRange,
      myOuterRange * 2,
      myOuterRange * 2,
      {
        name: self.shared.name,
        color: self.shared.color,
        borderWidth: borderWidth,
        textColor: self.shared.textColor,
      }
    )
    // drawShadow(
    //   myCtx,
    //   myMouseX - myOuterRange,
    //   myMouseY - myOuterRange,
    //   myOuterRange * 2,
    //   myOuterRange * 2
    // )
  }
}
