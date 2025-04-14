export interface UserData {
  id: string | undefined
  userName: string | undefined
  color: string | undefined
  textColor: string | undefined
  deviceId: string | undefined
}

const init = () => {
  // @ts-ignore
  chrome.runtime.onInstalled.addListener(() => {
    // @ts-ignore
    chrome.storage.local.set({
      data: {
        id: undefined,
        userName: undefined,
        color: "rgb(112, 255, 169)",
        textColor: "rgb(0, 0, 0)",
        deviceId: undefined,
      },
    })
  })
}

init()
