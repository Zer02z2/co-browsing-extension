import { UserData } from "./background"

const nameInput = document.getElementById("name") as HTMLInputElement
const colorInput = document.getElementById("color") as HTMLInputElement
const textColorInput = document.getElementById("text-color") as HTMLInputElement

const init = async () => {
  if (!(nameInput && colorInput && textColorInput)) return
  //@ts-ignore
  const bulb = await chrome.storage.local.get("data")
  const data: UserData = bulb.data
  nameInput.value = data.userName || ""
  colorInput.value = data.color || ""
  textColorInput.value = data.textColor || ""

  const updateMessage = () => {
    //@ts-ignore
    chrome.storage.local.set({
      data: data,
    })
    //@ts-ignore
    chrome.tabs.query({}, (tabs) => {
      if (tabs.length === 0) return
      //@ts-ignore
      tabs.forEach((tab) => {
        //@ts-ignore
        chrome.tabs.sendMessage(tab.id, { action: "dataChanged" })
      })
    })
  }

  nameInput.addEventListener("keyup", () => {
    data.userName = nameInput.value
    updateMessage()
  })
  colorInput.addEventListener("keyup", () => {
    data.color = colorInput.value
    //@ts-ignore
    updateMessage()
  })
  textColorInput.addEventListener("keyup", () => {
    data.textColor = textColorInput.value
    updateMessage()
  })
}

init()
