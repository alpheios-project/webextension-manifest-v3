/* global BUILD_NUMBER, BUILD_NAME, BUILD_BRANCH */
import Manifest from '@/manifest/manifest.json'
import BrowserActions from '@/utility/browser-actions.js'
import L10nSingleton from '@/lib/l10n/l10n-singleton.js'
import Locales from '@/locales/locales.js'

import {
    TabScript, AppController, ExtensionSyncStorage, HTMLPage, 
    AuthModule, PanelModule, PopupModule, ToolbarModule, ActionPanelModule, Platform, Logger
  } from 'alpheios-components'

/*
const BUILD_BRANCH = 'test'
const BUILD_NUMBER = '1'
const BUILD_NAME = 'test'
const mode = 'production'
*/
const logger = Logger.getInstance()


export default class ContentController {
  constructor () {
    this.appController = null
    this.defineL10Support()
  }

  get appModules () {
    return [
      { module: AuthModule, params: { auth: null } },
      { module: PanelModule, params: { mountPoint: '#alpheios-panel' } },
      { module: PopupModule, params: { mountPoint: '#alpheios-popup' } },
      { module: ToolbarModule},
      { module: ActionPanelModule }
    ]
  }

  async initialize () {
    document.body.addEventListener('Alpheios_Reload', () => {
      if (this.appController.state.isActive()) {
        this.appController.deactivate().catch((error) => logger.error(`Unable to deactivate Alpheios: ${error}`))
      }
      window.location.reload()
    })

    document.body.addEventListener('Alpheios_Embedded_Response', () => {
      this.appController.state.setEmbedLibActiveStatus()
      BrowserActions.sendMessageToBack({ state: 'content-state-update', tab: TabScript.serializable(this.appController.state) })
      
      this.embedLibCheck()
    })

    BrowserActions.addMessageListener(this.catchBackMessage.bind(this))

    const state = this.defineTabState()

    this.registerAppC(state)
    this.registerModules()
    await this.initAppC()

    await BrowserActions.sendMessageToBack({ state: 'content-init-finished' })
  }

  embedLibCheck () {
    if (this.appController.state.isEmbedLibActive() && this.appController.state.isActive()) {
      const embedLibWarning = AppController.getEmbedLibWarning(L10nSingleton.getMsgS('EMBED_LIB_WARNING_TEXT'))
      document.body.appendChild(embedLibWarning.$el)
      this.deactivateAppC()
    }
  }

  async activate (tab) {
    const diff = this.updateAppCState(tab)

    await this.activateAppC()
    this.definePanelState(diff)
    this.definePanelTabState(diff)

    this.embedLibCheck()
  }

  async deactivate (tab) {
    this.updateAppCState(tab)
    await this.deactivateAppC()
  }

  async catchBackMessage (message, sender, sendResponse) {
    if (message.state === 'content-activate') {
      await this.activate(message.tab)
    } else if (message.state === 'content-deactivate') {
      await this.deactivate(message.tab)
    }
    sendResponse({ tab: TabScript.serializable(this.appController.state) })
    return true
  }

  async sendStateToBackground () {
    try {
      await BrowserActions.sendMessageToBack({ state: 'content-state-update', tab: TabScript.serializable(this.appController.state) })
      return true
    } catch (error) {
      logger.error('Unable to send state to background', error)
    }
  }

  /***************************** */

  async deactivateAppC () {
    try {
      await this.appController.deactivate()
    } catch (error) {
      logger.error(`UI controller cannot be deactivated: ${error}`)
    }
  }

  async activateAppC () {
    try {
      await this.appController.activate()
      this.appController.state.setWatcher('panelStatus', this.sendStateToBackground.bind(this))
      this.appController.state.setWatcher('tab', this.sendStateToBackground.bind(this))
    } catch (error) {
      logger.error(`Unable to activate Alpheios: ${error}`)
    } 
  }

  definePanelState (diff) {
    if (!diff.has('panelStatus')) { return }

    if (diff.panelStatus === TabScript.statuses.panel.OPEN) {
      return this.appController.api.ui.openPanel()
    }
    if (diff.panelStatus === TabScript.statuses.panel.CLOSED) {
      return this.appController.api.ui.closePanel()
    }
  }

  definePanelTabState (diff) {
    if (diff.has('tab') && diff.tab) {
      this.appController.api.ui.changeTab(diff.tab)
    }
  }

  defineTabState () {
    let state = new TabScript()
    state.status = TabScript.statuses.script.PENDING
    state.setPanelDefault()
    state.setTabDefault()
    return state
  }

  registerAppC (state) {
    const browserManifest = Manifest

    const url = new URL(window.location.href)
    let mode = url.searchParams.get('mode')
    mode = (['dev', 'development'].includes(mode)) ? 'development' : 'production'

    this.appController = AppController.create(state, {
      storageAdapter: ExtensionSyncStorage,
      app: { name: browserManifest.name, version: browserManifest.version, buildBranch: BUILD_BRANCH, buildNumber: BUILD_NUMBER, buildName: BUILD_NAME },
      appType: Platform.appTypes.WEBEXTENSION,
      mode: mode
    })   
  }

  registerModules () {
    this.appModules.forEach(moduleData => {
      this.appController.registerModule(moduleData.module, moduleData.params)
    })
  }

  async initAppC () {
    try {
      await this.appController.init()
      this.appController.state.setEmbedLibStatus(HTMLPage.isEmbedLibActive)
    } catch (error) {
      logger.error('Unable to activate Alpheios', error)
    }
    
  }

  updateAppCState (tab) {
    const requestState = TabScript.readObject(tab)
    const diff = this.appController.state.diff(requestState)

    if (diff.has('tabID') && (!this.appController.state.tabID) ) {
      this.appController.state.tabID = diff.tabID
      this.appController.state.tabObj = requestState.tabObj
    }

    if (diff.has('tabID') && this.appController.state.tabID && (!this.appController.state.tabID === diff.tabID)) {
      logger.warn(`State request with the wrong tab ID "${Symbol.keyFor(diff.tabID)}" received. This tab ID is "${Symbol.keyFor(this.appController.state.tabID)}"`)
      // TODO: Should we ignore such requests?
      this.appController.state.tabID = requestState.tabID
      this.appController.state.tabObj = requestState.tabObj
    }

    if (diff.has('status') && (diff.status === TabScript.statuses.script.ACTIVE)) {
      if (diff.has('panelStatus')) { 
        this.appController.state.panelStatus = diff.panelStatus 
      }
      if (diff.has('tab')) { 
        this.appController.state.tab = diff.tab 
      }
    }

    return diff
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
}
