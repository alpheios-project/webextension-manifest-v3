/* global chrome */

import BackController from '@/controllers/back-controller'
import Browser from '@/lib/browser'

// Detect browser features
const browserFeatures = new Browser().inspect().getFeatures()
console.log(`Support of a "browser" namespace: ${browserFeatures.browserNamespace}`)
if (!browserFeatures.browserNamespace) {
  // console.log('"browser" namespace is not supported, will load a WebExtensions polyfill into the background script')
  self.browser = chrome
}

const backC = new BackController() // eslint-disable-line prefer-const
backC.initialize()