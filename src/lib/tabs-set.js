import { Tab, TabScript } from 'alpheios-data-models'

export default class TabsSet {
  constructor () {
    this.items = {}
  }

  existItemId ({ tabId, windowId }) {
    const tmpUniqueTabId = Tab.createUniqueIdNew(tabId, windowId)
    return this.items[tmpUniqueTabId]
  }

  getItem ({ tabId, windowId }) {
    const tmpUniqueTabId = Tab.createUniqueIdNew(tabId, windowId)
    return this.items[tmpUniqueTabId] ? this.items[tmpUniqueTabId] : undefined
  }

  updateTabWindowId ({ tabId, oldWindowId, newWindowId }) {
    const oldTab = this.getItem({ tabId, windowId: oldWindowId })
    const newTab = this.getItem({ tabId, windowId: newWindowId })

    if (oldTab) {
      this.items[newTab.uniqueIdNew] = this.items[oldTab.uniqueIdNew]
      delete this.items[oldTab.uniqueIdNew]
    }
    
    return newTab
  }

  removeItem ({ tabId, windowId }) {
    const tmpUniqueTabId = Tab.createUniqueIdNew(tabId, windowId)
    if (this.items[tmpUniqueTabId]) {
      delete this.items[tmpUniqueTabId]
      return true
    }
    return false
  }

  addItem ({ tabId, windowId }) {
    const tmpUniqueTabId = Tab.createUniqueIdNew(tabId, windowId)

    this.items[tmpUniqueTabId] = TabsSet.createTabItem({ tabId, windowId })
    return this.items[tmpUniqueTabId]
  }
  
  static createTabItem ({ tabId, windowId }) {
    const tabObj = new Tab(tabId, windowId)
    let newTab = new TabScript(tabObj) // eslint-disable-line prefer-const
    newTab.tab = TabScript.props.tab.values.INFO // Set active tab to `info` by default
    return newTab
  }
}
