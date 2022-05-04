/* global browser */
import AppData from '@/app-data.json'
import { Logger } from 'alpheios-data-models'

let browserIcons
const logger = Logger.getInstance()

export default class BrowserActions {
  static defineBrowserData () {
    if (!browserIcons) { browserIcons = AppData.browserIcons }
  }

  static setIconState (tabId, iconState) {
    let params = { path: iconState ? browserIcons.active : browserIcons.nonactive, tabId } // eslint-disable-line prefer-const
    browser.action.setIcon(params)
  }

  static setBadgeState (tabId, badgeState) {  
    if (badgeState) {
      browser.action.setBadgeText({ tabId, text: 'On' })
      browser.action.setBadgeBackgroundColor({ color: [252, 20, 20, 255] })
      if (browser.action.setBadgeTextColor) {
        browser.action.setBadgeTextColor({ color: '#fff' })
      }
    } else {
      browser.action.setBadgeText({ tabId, text: '' })
    }
  }

  static setTitle (title, tabId) {
    browser.action.setTitle({ title, tabId })
  }

  static async getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true }
    let [tab] = await browser.tabs.query(queryOptions)
    return tab
  }

  static async loadScripts (files, tabId) {
    try {
      const result = await browser.scripting.executeScript({ files, target: { tabId } })
      return result
    } catch (err) {
      logger.error(`Cannot load content script for a tab with an ID of tabId = ${tabId} ${JSON.stringify(files)}`)
    }
  }

  static async loadCSSFiles (files, tabId) {
    try {
      const result = await browser.scripting.insertCSS({ files, target: { tabId } })
      return result
    } catch (err) {
      logger.error(`Cannot load content css for a tab with an ID of tabId = ${tabId} ${JSON.stringify(files)}`)
    }
  }

  static createContextMenuItem (props) {
    browser.contextMenus.create(props)
  }

  static removeContextMenuItem (id) {
    browser.contextMenus.remove(id)
  }

  static addMessageListener (callbackFn) {
    browser.runtime.onMessage.addListener(callbackFn)
  }

  static async sendMessageToBack ({ state, tab }) {
    try {
      await browser.runtime.sendMessage({ state, tab })
    } catch (error) {
      logger.error(`There is a problem with sending message to back - ${error}`)
    }
  }

  static async executeScript ({ tabId, func, hideError }) {
    try {
      await browser.scripting.executeScript({ target: { tabId }, func })
    } catch (error) {
      if (!hideError) {
        logger.error(`There is a problem with executing script - ${error}`)
      }
    }
  }
  
}

