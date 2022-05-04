import L10nSingleton from '@/lib/l10n/l10n-singleton.js'
import ContextMenuItem from '@/lib/context-menu-item'

export default class ContextMenu {
  constructor () {
    this.items = {}
  }

  initialize () {
    this.items = {
      activate: new ContextMenuItem({ id: ContextMenu.menuItemId.activate, title: L10nSingleton.getMsgS(ContextMenu.menuItemText.activate) }),
      deactivate: new ContextMenuItem({ id: ContextMenu.menuItemId.deactivate, title: L10nSingleton.getMsgS(ContextMenu.menuItemText.deactivate) }),
      separatorOne: new ContextMenuItem({ id: ContextMenu.menuItemId.separator, isSeparator: true }),
      info: new ContextMenuItem({ id: ContextMenu.menuItemId.info, title: L10nSingleton.getMsgS(ContextMenu.menuItemText.info) }),
      disabled: new ContextMenuItem({ id: ContextMenu.menuItemId.disabled, title: L10nSingleton.getMsgS(ContextMenu.menuItemText.disabled) })
    }
    this.setState('initial')
  }

  disableAll () {
    Object.keys(this.items).forEach(itemKey => {
      this.items[itemKey].disable()
    })
  }

  setState (stateName) {
    Object.keys(this.states[stateName]).forEach(menuName => {
      if (this.states[stateName][menuName]) {
        this.items[menuName].enable()
      } else {
        this.items[menuName].disable()
      }
    })
  }

  get states () {
    return {
      initial: {
        activate: true,
        deactivate: false,
        separatorOne: false,
        info: false,
        disabled: false
      },
      activeWithPanel: {
        activate: false,
        deactivate: true,
        separatorOne: true,
        info: true,
        disabled: false
      },
      activeWithoutPanel: {
        activate: false,
        deactivate: true,
        separatorOne: false,
        info: false,
        disabled: false
      },
      deactivated: {
        activate: true,
        deactivate: false,
        separatorOne: false,
        info: false,
        disabled: false
      },
      embedDisabled: {
        activate: false,
        deactivate: false,
        separatorOne: false,
        info: false,
        disabled: true
      }
    }
  }
}

ContextMenu.menuItemId = {
  activate: 'activate-alpheios-content',
  deactivate: 'deactivate-alpheios-content',
  separator: 'separator-one',
  info: 'show-alpheios-panel-info',
  disabled: 'disabled-alpheios-content'
}

ContextMenu.menuItemText = {
  activate: 'CONTEXT_MENU_ACTIVATE',
  deactivate: 'CONTEXT_MENU_DEACTIVATE',
  info: 'CONTEXT_MENU_INFO',
  disabled: 'CONTEXT_MENU_DISABLED'
}
