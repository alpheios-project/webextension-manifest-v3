import BrowserActions from '@/utility/browser-actions.js'

export default class ContentMenuItem {
  constructor ({ id, title, actionFunc, isSeparator }) {
    this.id = id
    this.title = title
    this.actionFunc = actionFunc
    this.isActive = false
    this.isSeparator = isSeparator
  }

  enable () {
    if (!this.isActive & !this.isSeparator) {
      const enableProps = this.isSeparator ? { id: this.id, type: 'separator' } : {id: this.id, title: this.title }
      BrowserActions.createContextMenuItem(enableProps)
      this.isActive = true
    }
  }

  disable () {
    if (this.isActive & !this.isSeparator) {
      BrowserActions.removeContextMenuItem(this.id)
      this.isActive = false
    }
  }
}


