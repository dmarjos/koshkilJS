/**
 * Koshkil I18n Module
 * 
 * Provides translation functionality for JavaScript applications.
 * Requires translation data to be loaded via the I18n controller endpoint.
 * 
 * @requires jQuery
 * @requires $.koshkilJS (Koshkil core)
 * 
 * @usage
 *   // Simple translation
 *   var message = $.koshkilJS.modules.translations.helpers.t('common.save');
 * 
 *   // With parameters
 *   var error = $.koshkilJS.modules.translations.helpers.t('errors.record_not_found', {type: 'Usuario'});
 * 
 *   // From specific domain
 *   var validation = $.koshkilJS.modules.translations.helpers.t('required_field', {}, 'validation');
 */

$.koshkilJS = $.koshkilJS || {};
$.koshkilJS.modules = $.koshkilJS.modules || {};

// Initialize i18n data object if not present
$.koshkilJS.i18n = $.koshkilJS.i18n || {
    language: 'es',
    core: {},
    plugin: null
};

$.extend($.koshkilJS.modules, {
    translations: {
        helpers: {
            /**
             * Translate a key to the current language
             * 
             * @param {string} key - Translation key (dot notation: 'category.subcategory.key')
             * @param {object} params - Optional parameters to replace in translation string
             * @param {string} domain - Optional domain (defaults to 'common')
             * @returns {string} Translated string or key if translation not found
             */
            t: function(key, params, domain) {
                domain = domain || 'common';
                if (!key.startsWith('js.') && domain != 'common') {
                    key = 'js.' + key;
                }
                var keys = key.split('.');
                var translation = null;
                
                // Try to find in core translations
                if ($.koshkilJS.i18n.core[domain]) {
                    translation = $.koshkilJS.i18n.core[domain];
                    for (var i = 0; i < keys.length; i++) {
                        if (translation && translation[keys[i]] !== undefined) {
                            translation = translation[keys[i]];
                        } else {
                            translation = null;
                            break;
                        }
                    }
                }
                
                // If not found and plugin exists, try plugin translations
                if (!translation && $.koshkilJS.i18n.plugin && $.koshkilJS.i18n.plugin.translations[domain]) {
                    translation = $.koshkilJS.i18n.plugin.translations[domain];
                    for (var i = 0; i < keys.length; i++) {
                        if (translation && translation[keys[i]] !== undefined) {
                            translation = translation[keys[i]];
                        } else {
                            translation = null;
                            break;
                        }
                    }
                }
                
                // If translation not found, return key
                if (translation === null || typeof translation !== 'string') {
                    return key;
                }
                
                // Replace placeholders if params provided
                if (params && typeof params === 'object') {
                    for (var param in params) {
                        if (params.hasOwnProperty(param)) {
                            translation = translation.replace(new RegExp('\\{' + param + '\\}', 'g'), params[param]);
                        }
                    }
                }
                
                return translation;
            },
            
            /**
             * Get translation from specific domain (convenience method)
             * 
             * @param {string} domain - Translation domain
             * @param {string} key - Translation key
             * @param {object} params - Optional parameters
             * @returns {string} Translated string
             */
            td: function(domain, key, params) {
                return this.t(key, params, domain);
            },
            
            /**
             * Check if a translation key exists
             * 
             * @param {string} key - Translation key
             * @param {string} domain - Optional domain (defaults to 'common')
             * @returns {boolean} True if translation exists
             */
            hasTranslation: function(key, domain) {
                domain = domain || 'common';
                var keys = key.split('.');
                var translation = null;
                
                // Check core translations
                if ($.koshkilJS.i18n.core[domain]) {
                    translation = $.koshkilJS.i18n.core[domain];
                    for (var i = 0; i < keys.length; i++) {
                        if (translation && translation[keys[i]] !== undefined) {
                            translation = translation[keys[i]];
                        } else {
                            return false;
                        }
                    }
                    if (typeof translation === 'string') {
                        return true;
                    }
                }
                
                // Check plugin translations
                if ($.koshkilJS.i18n.plugin && $.koshkilJS.i18n.plugin.translations[domain]) {
                    translation = $.koshkilJS.i18n.plugin.translations[domain];
                    for (var i = 0; i < keys.length; i++) {
                        if (translation && translation[keys[i]] !== undefined) {
                            translation = translation[keys[i]];
                        } else {
                            return false;
                        }
                    }
                    return typeof translation === 'string';
                }
                
                return false;
            },
            
            /**
             * Get current language
             * 
             * @returns {string} Current language code
             */
            getLanguage: function() {
                return $.koshkilJS.i18n.language || 'es';
            },
            
            /**
             * Get all translations for a specific domain
             * 
             * @param {string} domain - Domain name
             * @returns {object|null} Translation object or null if not found
             */
            getDomain: function(domain) {
                if ($.koshkilJS.i18n.core[domain]) {
                    return $.koshkilJS.i18n.core[domain];
                }
                
                if ($.koshkilJS.i18n.plugin && $.koshkilJS.i18n.plugin.translations[domain]) {
                    return $.koshkilJS.i18n.plugin.translations[domain];
                }
                
                return null;
            }
        },
        
        init: function() {
            // Initialize the translations module
            // This can be called after translation data is loaded
            if ($.koshkilJS.i18n && $.koshkilJS.i18n.language) {
                console.log('Translations module initialized for language: ' + $.koshkilJS.i18n.language);
            }
        }
    }
});
