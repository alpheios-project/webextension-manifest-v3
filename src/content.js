/* global chrome */
import ContentController from '@/controllers/content-controller'
import Browser from '@/lib/browser'

// Detect browser features
const browserFeatures = new Browser().inspect().getFeatures()
console.log(`Support of a "browser" namespace: ${browserFeatures.browserNamespace}`)
if (!browserFeatures.browserNamespace) {
  // console.log('"browser" namespace is not supported, will load a WebExtensions polyfill into the background script')
  window.browser = chrome
}

const contentC = new ContentController() // eslint-disable-line prefer-const
contentC.initialize()