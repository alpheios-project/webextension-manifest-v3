/* global browser */
import BrowserActions from '@/utility/browser-actions.js'
import TabsSet from '@/lib/tabs-set'
import ContextMenu from '@/lib/context-menu'
import AppData from '@/app-data.json'

import L10nSingleton from '@/lib/l10n/l10n-singleton.js'
import Locales from '@/locales/locales.js'

import { TabScript } from 'alpheios-data-models'

export default class BackController {
  constructor () {
    this.tabs = new TabsSet()
    this.menu = new ContextMenu()
    this.defineL10Support()
  }

  initialize () {  
    BrowserActions.defineBrowserData()
    browser.tabs.onActivated.addListener(this.tabActivationListener.bind(this))
    // browser.tabs.onAttached.addListener(this.tabAttachedListener.bind(this))
    browser.tabs.onDetached.addListener(this.tabDetachedListener.bind(this))
    browser.tabs.onRemoved.addListener(this.tabRemovalListener.bind(this))
    // browser.tabs.onCreated.addListener(this.tabCreatedListener.bind(this))
    browser.tabs.onUpdated.addListener(this.tabUpdatedListener.bind(this))

    browser.action.onClicked.addListener(this.browserActionListener.bind(this))
    browser.contextMenus.onClicked.addListener(this.menuListener.bind(this))

    browser.runtime.onMessage.addListener(this.catchContentMessage.bind(this))
    browser.runtime.onInstalled.addListener(this.handleOnInstalled.bind(this))


    this.menu.initialize()
  }

  tabActivationListener (info) {
    const tab = this.tabs.getItem({ tabId: info.tabId, windowId: info.windowId })
    this.updateUI(tab)    
  }

  async tabDetachedListener (tabId, detachInfo) {
    const currentTab = await BrowserActions.getCurrentTab()
    const newTab = this.tabs.updateTabWindowId({ tabId, oldWindowId: detachInfo.oldWindowId, newWindowId: currentTab.windowId })
    this.setBrowserState(newTab)
  }

  tabRemovalListener (tabId, removeInfo) {
    this.tabs.removeItem({ tabId, windowId: removeInfo.windowId })
  }

  async tabUpdatedListener (tabId, changeInfo, tabOuter) {   
    if (!tabOuter.active) { return }
    
    const tabExist = this.tabs.existItemId({ tabId: tabOuter.id, windowId: tabOuter.windowId })
    if (tabExist && (changeInfo.status === 'loading')) {
      const tab = this.tabs.getItem({ tabId: tabOuter.id, windowId: tabOuter.windowId })
      await this.activateContent(tab, true)
      this.checkEmbeddedContent(tabOuter.id)
      this.updateUI(tab)

      if (tab.isActive()) {
        this.notifyPageActive(tabOuter.id)
      }
    }
  }

  async browserActionListener (tabOuter) {
    let tab = this.tabs.getItem({ tabId: tabOuter.id, windowId: tabOuter.windowId })

    if (tab && tab.isActive()) {
      await this.deactivateContent(tab)
    } else {
      const loadContent = !tab
      if (!tab) {
        tab = this.tabs.addItem({ tabId: tabOuter.id, windowId: tabOuter.windowId })
      }
      await this.activateContent(tab, loadContent)
    }
    this.updateUI(tab)   
  }

  async menuListener (info, tabOuter) {
    let tab = this.tabs.getItem({ tabId: tabOuter.id, windowId: tabOuter.windowId })
    const loadContent = !tab
    if (!tab) {
      tab = this.tabs.addItem({ tabId: tabOuter.id, windowId: tabOuter.windowId })
    }

    if (info.menuItemId === ContextMenu.menuItemId.activate) {
      this.activateContent(tab, loadContent)
    } else if (info.menuItemId === ContextMenu.menuItemId.deactivate) {
      await this.deactivateContent(tab)
    } else if (info.menuItemId === ContextMenu.menuItemId.info) {
      this.openInfoTab(tab)
    }
    this.updateUI(tab) 
  }

  async handleOnInstalled (details) {
    if (details.previousVersion) {
      const tabs = await browser.tabs.query({})
      for (let i=0; i<tabs.length; i++) {
        const tab = tabs[i]

        BrowserActions.executeScript ({ 
          tabId: tab.id, hideError: true,
          func: () => { document.body.dispatchEvent(new Event('Alpheios_Reload')) }
        })
      }
    }
  }

  catchContentMessage (message, sender, sendResponse) { // eslint-disable-line no-unused-vars
    let tab = this.tabs.getItem({ tabId: sender.tab.id, windowId: sender.tab.windowId })

    if (!tab) { return false }
    let contentState
    
    if (message.tab) {
      contentState = TabScript.readObject(message.tab)
      contentState.updateTabObject(sender.tab.id, sender.tab.windowId)
      tab.embedLibStatus = contentState.embedLibStatus
    }

    if (message.state === 'content-init-finished') {
      if (!tab.isEmbedLibActive()) {
        this.setContentState(tab)   
      }
    }
    if (message.state === 'content-state-update') {

      if (!contentState.isPending()) {
        tab.update(contentState)
      }
      this.updateUI(tab)
    }
    return true
  }
 
  async setContentState (tab) {
    let result
    if (tab && tab.isActive() ) {
      result = await browser.tabs.sendMessage(tab.tabObj.tabId, { state: 'content-activate', tab: TabScript.serializable(tab) })
    } else if (tab && !tab.isActive() ) {
      result = await browser.tabs.sendMessage(tab.tabObj.tabId, { state: 'content-deactivate', tab: TabScript.serializable(tab) })
    }

    const contentState = TabScript.readObject(result.tab)
    if (contentState.isDeactivated() && !contentState.isEmbedLibActive()) {
      /*
        If this is a user initiated deactivation (not the one caused by the presence
        of an embedded library), reset to default panel and tab status then.
          */
      this.setDefaultTabState(tab)
    } else {
      // This is an activation or forced deactivation (due to embedded library's presence)
      tab.update(contentState)
    }
    this.updateUI(tab)
    return true
  }

  async activateContent (tab, loadContent = false) {
    tab.activate()
    
    if (loadContent) {
      try {
        await this.loadContentData(tab.tabObj.tabId)
      } catch (error) {
        console.error(`Cannot load content script for a tab with an ID of `, error)
      } 
    } else {
      await this.setContentState(tab)   
    }
    this.notifyPageActive(tab.tabObj.tabId)
  }

  async deactivateContent (tab) {
    tab.deactivate()
    await this.setContentState(tab)  
    this.notifyPageInactive(tab.tabObj.tabId)   
  }

  updateBrowserActionForTab (tab) {
    if (tab && tab.hasOwnProperty('status')) { // eslint-disable-line no-prototype-builtins
      if (tab.isEmbedLibActive() || tab.isDisabled()) {
        BrowserActions.setTitle(BackController.browserActionTitles.activate, tab.tabObj.tabId)
      } else if (tab.isActive()) {
        BrowserActions.setTitle(BackController.browserActionTitles.deactivate, tab.tabObj.tabId)
      } else if (tab.isDeactivated()) {
        BrowserActions.setTitle(BackController.browserActionTitles.disabled, tab.tabObj.tabId)
      }
    }
  }

  checkEmbeddedContent (tabId) {
    BrowserActions.executeScript ({ 
      tabId,
      func: () => { document.body.dispatchEvent(new Event('Alpheios_Embedded_Check')) }
    })
  }

  async openPanel (tab) {
    tab.activate().setPanelOpen()
    this.setContentState(tab)
  }

  async openInfoTab (tab) {
    tab.activate().setPanelOpen().changeTab('info')
    this.setContentState(tab)
  }

  setBrowserState (tab) {
    if (!tab) { return }
    const badgeState = tab.isActive() && !tab.isEmbedLibActive()
    BrowserActions.setBadgeState(tab.tabObj.tabId, badgeState)

    const iconState = tab ? tab.isActive() && !tab.isEmbedLibActive() : false
    BrowserActions.setIconState(tab.tabObj.tabId, iconState)    
  }

  setMenuForTab (tab) {
    this.menu.disableAll()
    if (!tab) { 
      this.menu.setState('initial')
    } else {
      if (tab.hasOwnProperty('status')) { 
        if (tab.isEmbedLibActive() || tab.isDisabled()) {
          this.menu.setState('embedDisabled')
        } else if (tab.isActive() && tab.isPanelOpen()) {
          this.menu.setState('activeWithPanel')
        } else if (tab.isActive() && !tab.isPanelOpen()) {
          this.menu.setState('activeWithoutPanel')
        } else if (tab.isDeactivated()) {
          this.menu.setState('deactivated')
        }
      }
    }
  }

  updateUI (tab) {
    this.setBrowserState(tab)
    this.setMenuForTab(tab)
    this.updateBrowserActionForTab(tab)
  }

  setDefaultTabState (tab) {
    tab.setPanelDefault()
    tab.setTabDefault()
    return this
  }
  
  async loadContentData (tabId) {
    const result1 = await BrowserActions.loadScripts(AppData.scripts, tabId)
    const result2 = await BrowserActions.loadCSSFiles(AppData.css, tabId)

    return { js: result1, css: result2 }
  }

  notifyPageActive (tabId) {
    BrowserActions.executeScript ({ 
      tabId,
      func: () => { document.body.dispatchEvent(new Event('Alpheios_Active')) }
    })
  }
  
  notifyPageInactive (tabId) {
    BrowserActions.executeScript ({ 
      tabId,
      func: () => { document.body.dispatchEvent(new Event('Alpheios_Inactive')) }
    })
  }

  defineL10Support () {
    const config = {
      defaultLocale: Locales.en_US,
      messageBundles: Locales.bundleArr(Locales.predefinedLocales())
    }

    const l10n = new L10nSingleton()
    config.messageBundles.forEach(mb => l10n.addMessageBundle(mb))
    l10n.setLocale(config.defaultLocale)
    return l10n
  }

  static get browserActionTitles () {
    return {
      activate: L10nSingleton.getMsgS("LABEL_BROWSERACTION_ACTIVATE"),
      deactivate: L10nSingleton.getMsgS("LABEL_BROWSERACTION_DEACTIVATE"),
      disabled: L10nSingleton.getMsgS("LABEL_BROWSERACTION_DISABLED")
    }
  }
}
