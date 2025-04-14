import { io } from "socket.io-client"
import { Peer } from "peerjs"
import { v4 as uuidv4 } from "uuid"
import { UserData } from "../background"
import { displayVideo } from "./displayVideo"

export interface PeerUser {
  id: string
  canvas: HTMLCanvasElement
  video?: HTMLVideoElement
  mouseX: number | null
  mouseY: number | null
  videoW: number
  videoH: number
  name: string
  color?: string
}

export interface SelfUser {
  shared: {
    mouseX: number
    mouseY: number
    videoW: number
    videoH: number
    name: string
    color?: string
    textColor?: string
  }
  local: {
    canvas: HTMLCanvasElement
  }
}

export const stream = () => {
  let currentPeers: PeerUser[] = []

  const roomId = 1
  const dev = false
  const socketUrl = `${
    dev
      ? "http://localhost:3001/screenShare"
      : "https://io.zongzechen.com/screenShare"
  }`

  const createCanvas = () => {
    const canvas = document.createElement("canvas")
    canvas.style.position = "fixed"
    canvas.style.width = "100vw"
    canvas.style.height = "100vh"
    canvas.style.zIndex = "999"
    canvas.style.left = "0"
    canvas.style.top = "0"
    canvas.style.pointerEvents = "none"
    canvas.className = "ignore-effects"
    document.body.appendChild(canvas)
    return canvas
  }

  const createVideo = (stream: MediaStream) => {
    const video = document.createElement("video")
    video.srcObject = stream
    video.addEventListener("loadedmetadata", () => {
      video.play()
    })
    return video
  }

  const self: SelfUser = {
    shared: {
      mouseX: 0,
      mouseY: 0,
      videoW: window.innerWidth,
      videoH: window.innerHeight,
      name: "",
      color: undefined,
      textColor: undefined,
    },
    local: {
      canvas: createCanvas(),
    },
  }

  const init = async () => {
    document.addEventListener("mousemove", (event) => {
      self.shared.mouseX = event.clientX
      self.shared.mouseY = event.clientY
      self.shared.videoW = window.innerWidth
      self.shared.videoH = window.innerHeight
    })
    const updateSelfData = async () => {
      // @ts-ignore
      const bulb = await chrome.storage.local.get("data")
      const userData: UserData = bulb.data
      if (!userData.id) {
        userData.id = uuidv4()
      }
      if (!userData.userName) {
        userData.userName = userData.id
      }
      // @ts-ignore
      chrome.storage.local.set({ data: userData })
      self.shared.name = userData.userName
      self.shared.color = userData.color
      self.shared.textColor = userData.textColor
    }
    await updateSelfData()

    //@ts-ignore
    chrome.runtime.onMessage.addListener((message) => {
      console.log(message)
      if (message.action === "dataChanged") {
        updateSelfData()
      }
    })

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
      },
      audio: false,
      // @ts-ignore
      preferCurrentTab: true,
    })

    const socket = io(socketUrl)

    const myPeer = new Peer(uuidv4(), {
      host: "io.zongzechen.com",
      path: "/peerjs",
      secure: true,
    })
    myPeer.on("open", (id) => {
      socket.emit("join-room", roomId, id)
    })

    myPeer.on("call", (call) => {
      console.log("receive call")
      call.answer(stream)

      call.on("stream", (userVideoStream) => {
        if (!currentPeers.find((peer) => peer.id === call.peer)) {
          createPeer(call.peer)
        }
        const peerUser = currentPeers.find((peer) => peer.id === call.peer)
        if (!peerUser) return
        peerUser.video = createVideo(userVideoStream)
      })
    })
    myPeer.on("connection", (conn) => {
      conn.on("open", () => {
        conn.on("data", (data) => {
          if (!currentPeers.find((peer) => peer.id === conn.peer)) {
            createPeer(conn.peer)
          }
          const peerUser = currentPeers.find((peer) => peer.id === conn.peer)
          if (!peerUser) return
          updatePeerData(peerUser, data)
        })
        window.addEventListener("mousemove", () => {
          conn.send(self.shared)
        })
        conn.send(self.shared)
      })
    })

    socket.on("user-connected", (userId) => {
      const call = myPeer.call(userId, stream)
      const conn = myPeer.connect(userId)
      const peerUser = createPeer(userId)
      call.on("stream", (userVideoStream) => {
        peerUser.video = createVideo(userVideoStream)
      })
      call.on("close", () => {})
      conn.on("open", () => {
        console.log("data open")
        conn.on("data", (data) => {
          updatePeerData(peerUser, data)
        })
        document.addEventListener("mousemove", () => {
          conn.send(self.shared)
        })
        conn.send(self.shared)
      })
    })
    socket.on("close-call", (userId) => {
      console.log("close id: ", userId)
      const index = currentPeers.findIndex((peer) => peer.id === userId)
      const peer = currentPeers[index]
      peer.canvas.remove()
      currentPeers.splice(index, 1)
    })
  }

  const createPeer = (id: string) => {
    const peerUser: PeerUser = {
      id: id,
      canvas: createCanvas(),
      mouseX: null,
      mouseY: null,
      videoW: 0,
      videoH: 0,
      name: "",
    }
    if (!currentPeers.find((peer) => peer.id === id)) {
      currentPeers.push(peerUser)
    }
    return peerUser
  }

  const updatePeerData = (peerUser: PeerUser, data: unknown) => {
    const peerData = data as {
      mouseX: number
      mouseY: number
      videoW: number
      videoH: number
      name: string
      color: string
    }
    peerUser.mouseX = peerData.mouseX
    peerUser.mouseY = peerData.mouseY
    peerUser.videoW = peerData.videoW
    peerUser.videoH = peerData.videoH
    peerUser.name = peerData.name
    peerUser.color = peerData.color
  }

  const animate = () => {
    displayVideo(self, currentPeers)
    requestAnimationFrame(animate)
  }

  init()
  animate()
}
