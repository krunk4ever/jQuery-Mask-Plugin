 /**
 * jquery.mask.js
 * @version: v0.11.0
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at http://blog.igorescobar.com
 *
 * Copyright (c) 2012 Igor Escobar http://blog.igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

(function ($) {
    "use strict";
    var  e;
    var Mask = function (el, mask, options) {
        var jMask = this,
            $el = $(el),
            defaults = {
                byPassKeys: [8, 9, 37, 38, 39, 40],
                maskChars: {':': ':', '-': '-', '.': '\\\.', '(': '\\(', ')': '\\)', '/': '\/', ',': ',', '_': '_', ' ': '\\s', '+': '\\\+'},
                translationNumbers: {0: '\\d', 1: '\\d', 2: '\\d', 3: '\\d', 4: '\\d', 5: '\\d', 6: '\\d', 7: '\\d', 8: '\\d', 9: '\\d'},
                translation: {'A': '[a-zA-Z0-9]', 'S': '[a-zA-Z]'}
            };


        jMask.init = function() {
            jMask.settings = {};
            options = options || {};

            defaults.translation = $.extend({}, defaults.translation, defaults.translationNumbers)
            jMask.settings = $.extend(true, {}, defaults, options);
            jMask.settings.specialChars = $.extend({}, jMask.settings.maskChars, jMask.settings.translation);

            $el.each(function() {
                mask = p.resolveMask();
                mask = p.fixRangeMask(mask);

                $el.attr('maxlength', mask.length);
                $el.attr('autocomplete', 'off');

                p.destroyEvents();
                p.setOnKeyUp();
                p.setOnPaste();
            });
        };

        var p = {
            onPasteMethod: function() {
                setTimeout(function() {
                    $el.trigger('keyup');
                }, 100);
            },
            setOnPaste: function() {
                $el.bind("paste", p.onPasteMethod);
            },
            setOnKeyUp: function() {
                $el.keyup(p.maskBehaviour).trigger('keyup');
            },
            destroyEvents: function() {
                $el.unbind('keyup').unbind('paste');
            },
            resolveMask: function() {
                return typeof mask == "function" ? mask(p.getVal(), e, options) : mask;
            },
            setVal: function(v) {
                $el.get(0).tagName.toLowerCase() === "input" ? $el.val(v) : $el.html(v);
                return $el;
            },
            getVal: function() {
                return $el.get(0).tagName.toLowerCase() === "input" ? $el.val() : $el.text();
            },
            specialChar: function (mask, pos) {
                return jMask.settings.specialChars[mask.charAt(pos)];
            },
            maskChar: function (mask, pos) {
                return jMask.settings.maskChars[mask.charAt(pos)];
            },
            maskBehaviour: function(e) {
                e = e || window.event;
                var keyCode = e.keyCode || e.which;

                if ($.inArray(keyCode, jMask.settings.byPassKeys) > -1) return p.seekCallbacks(e, newVal);

                var newVal = p.applyMask(mask);

                if (newVal !== p.getVal())
                    p.setVal(newVal).trigger('change');

                return p.seekCallbacks(e, newVal);
            },
            applyMask: function (mask) {
                if (p.getVal() === "") return;

                var hasMore = function (entries, i) {
                    while (i < entries.length) {
                        if (entries[i] !== undefined) return true;
                        i++;
                    }
                    return false;
                },
                getMatches = function (v) {
                    v = (typeof v === "string") ? v : v.join("");
                    var matches = v.match(new RegExp(p.maskToRegex(mask))) || [];
                    matches.shift();
                    return matches;
                },
                val = p.getVal(),
                mask = p.getMask(val, mask),
                val = options.reverse ? p.removeMaskChars(val) :  val, cDigitCharRegex,
                matches = getMatches(val);

                // cleaning
                while (matches.join("").length < p.removeMaskChars(val).length) {
                    matches = matches.join("").split("");
                    val = p.removeMaskChars(matches.join("") + val.substring(matches.length + 1));
                    mask = p.getMask(val, mask);
                    matches = getMatches(val);
                }

                // masking
                for (var k = 0; k < matches.length; k++) {
                    cDigitCharRegex = p.specialChar(mask, k);

                    if (p.maskChar(mask, k) && hasMore(matches, k)) {
                        matches[k] = mask.charAt(k);
                    } else {
                        if (cDigitCharRegex) {
                            if (matches[k] !== undefined) {
                                if (matches[k].match(new RegExp(cDigitCharRegex)) === null)
                                    break;
                            } else {
                                if ("".match(new RegExp(cDigitCharRegex)) === null) {
                                    matches = matches.slice(0, k);
                                    break;
                                }
                            }
                        }
                    }
                }
                return matches.join('');
            },
            getMask: function (cleanVal) {
                var reverseMask = function (oVal) {
                    oVal = p.removeMaskChars(oVal);
                    var startMask = 0, endMask = 0, m = 0, mLength = mask.length;
                    startMask = (mLength >= 1) ? mLength : mLength-1;
                    endMask = startMask;

                    while (m < oVal.length) {
                        while (p.maskChar(mask, endMask-1))
                            endMask--;
                        endMask--;
                        m++;
                    }

                    endMask = (mask.length >= 1) ? endMask : endMask-1;
                    return mask.substring(startMask, endMask);
                };

                return options.reverse ? reverseMask(cleanVal) : mask;
            },
            maskToRegex: function (mask) {
                var specialChar;
                for (var i = 0, regex = ''; i < mask.length; i ++) {
                    specialChar = p.specialChar(mask, i);
                    if (specialChar) regex += "(" + specialChar + ")?";
                }

                return regex;
            },
            fixRangeMask: function (mask) {
                var repeat = function (str, num) {
                    return new Array(num + 1).join(str);
                },
                rangeRegex = /([A-Z0-9])\{(\d+)?,([(\d+)])\}/g;

                return mask.replace(rangeRegex, function() {
                    var match = arguments,
                        mask = [],
                        charStr = (jMask.settings.translationNumbers[match[1]]) ?
                                    String.fromCharCode(parseInt("6" + match[1], 16)) : match[1].toLowerCase();

                    mask[0] = match[1];
                    mask[1] = repeat(match[1], match[2] - 1);
                    mask[2] = repeat(charStr, match[3] - match[2]).toLowerCase();

                    jMask.settings.specialChars[charStr] = p.specialChar(match[1]) + "?";

                    return mask.join("");
                });
            },
            removeMaskChars: function(string) {
                $.each(jMask.settings.maskChars, function(k,v){
                    string = string.replace(new RegExp("(" + jMask.settings.maskChars[k] + ")?", 'g'), '')
                });
                return string;
            },
            seekCallbacks: function (e, newVal) {
                if (options.onKeyPress && e.isTrigger === undefined &&
                    typeof options.onKeyPress == "function")
                        options.onKeyPress(newVal, e, $el, options);

                if (options.onComplete && e.isTrigger === undefined &&
                    newVal.length === mask.length && typeof options.onComplete == "function")
                        options.onComplete(newVal, e, $el, options);
            }
        };

        // qunit private methods testing
        if (typeof QUNIT === "boolean") jMask.p = p;

        // public methods
        jMask.remove = function() {
          p.destroyEvents();
          p.setVal(p.removeMaskChars(p.getVal()));
          $el.removeAttr('maxlength');
        };
        
        // get value without mask
        jMask.getCleanVal = function() {
          return p.removeMaskChars(p.getVal());
        };

        jMask.init();
    };

    $.fn.mask = function(mask, options) {
        return this.each(function() {
            $(this).data('mask', new Mask(this, mask, options));
        });
    };

    // looking for inputs with data-mask attribute
    $('input[data-mask]').each(function() {
        $(this).mask($(this).attr('data-mask'));
    });
   
})(window.jQuery || window.Zepto);