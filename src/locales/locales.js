import EnUsContent from '@/locales/en-us/messages-content.json'
import EnUsBackground from '@/locales/en-us/messages-background.json'

import EnGb from '@/locales/en-gb/messages.json'

import MessageBundle from '@/lib/l10n/message-bundle'

const localeEnUs = 'en-US'
const localeEnGb = 'en-GB'
const availableMessages = {
  [localeEnUs]: [EnUsContent, EnUsBackground],
  [localeEnGb]: [EnGb]
}

export default {
  en_US: localeEnUs,
  en_GB: localeEnGb,
  availableMessages: availableMessages,

  predefinedLocales: () => {
    const finalLocales = []
    Object.keys(availableMessages).forEach(localeItem => {
      availableMessages[localeItem].forEach(messageItem => finalLocales.push([messageItem, localeItem]))
    })

    return finalLocales
  },

  /**
   * A helper function that creates a message bundle out of a messages JSON and a locale.
   *
   * @param {string | object} messagesJSONorObj - Messages for a locale as a JSON string or as an object.
   * @param {string} locale - A locale code for a message group. IETF language tag format is recommended.
   * @returns {MessageBundle} A message bundle with messages from JSON.
   */
  createBundle: (messagesJSONorObj, locale) => {
    return new MessageBundle(messagesJSONorObj, locale)
  },
  /**
   * Same as above, but creates an array of message bundles out of an array of messages JSONs and a locales.
   *
   * @param {Array.<string | object, number>[]} msgArr - An array of arrays with
   * the first element being {string | object} messagesJSONorObj - messages for a locale as a JSON string or as an object,
   * and the second element being {string} locale - a locale code for a message group. IETF language tag format is recommended.
   * @returns {MessageBundle[]} An array of message bundles.
   */
  createBundleArr: (msgArr) => {
    return msgArr.map((m) => new MessageBundle(...m))
  },
  /**
   * Creates an array of message bundles out of all availableMessages.
   *
   * @returns {MessageBundle[]} An array of message bundles.
   */
  bundleArr: () => {
    let msgArray = [] // eslint-disable-line prefer-const
    for (const [locale, messages] of Object.entries(availableMessages)) {
      msgArray.push(...messages.map(m => new MessageBundle(m, locale)))
    }
    return msgArray
  }
}
