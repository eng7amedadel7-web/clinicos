(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.paddle = {}));
})(this, (function (exports) { 'use strict';

  function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c),
        u = i.value;
    } catch (n) {
      return void e(n);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator(n) {
    return function () {
      var t = this,
        e = arguments;
      return new Promise(function (r, o) {
        var a = n.apply(t, e);
        function _next(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
        }
        function _throw(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
        }
        _next(void 0);
      });
    };
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o,
      r,
      i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var s = Object.getOwnPropertySymbols(e);
      for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (e.includes(n)) continue;
      t[n] = r[n];
    }
    return t;
  }
  function _regeneratorRuntime() {
    _regeneratorRuntime = function () {
      return e;
    };
    var t,
      e = {},
      r = Object.prototype,
      n = r.hasOwnProperty,
      o = Object.defineProperty || function (t, e, r) {
        t[e] = r.value;
      },
      i = "function" == typeof Symbol ? Symbol : {},
      a = i.iterator || "@@iterator",
      c = i.asyncIterator || "@@asyncIterator",
      u = i.toStringTag || "@@toStringTag";
    function define(t, e, r) {
      return Object.defineProperty(t, e, {
        value: r,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), t[e];
    }
    try {
      define({}, "");
    } catch (t) {
      define = function (t, e, r) {
        return t[e] = r;
      };
    }
    function wrap(t, e, r, n) {
      var i = e && e.prototype instanceof Generator ? e : Generator,
        a = Object.create(i.prototype),
        c = new Context(n || []);
      return o(a, "_invoke", {
        value: makeInvokeMethod(t, r, c)
      }), a;
    }
    function tryCatch(t, e, r) {
      try {
        return {
          type: "normal",
          arg: t.call(e, r)
        };
      } catch (t) {
        return {
          type: "throw",
          arg: t
        };
      }
    }
    e.wrap = wrap;
    var h = "suspendedStart",
      l = "suspendedYield",
      f = "executing",
      s = "completed",
      y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var p = {};
    define(p, a, function () {
      return this;
    });
    var d = Object.getPrototypeOf,
      v = d && d(d(values([])));
    v && v !== r && n.call(v, a) && (p = v);
    var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
    function defineIteratorMethods(t) {
      ["next", "throw", "return"].forEach(function (e) {
        define(t, e, function (t) {
          return this._invoke(e, t);
        });
      });
    }
    function AsyncIterator(t, e) {
      function invoke(r, o, i, a) {
        var c = tryCatch(t[r], t, o);
        if ("throw" !== c.type) {
          var u = c.arg,
            h = u.value;
          return h && "object" == typeof h && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
            invoke("next", t, i, a);
          }, function (t) {
            invoke("throw", t, i, a);
          }) : e.resolve(h).then(function (t) {
            u.value = t, i(u);
          }, function (t) {
            return invoke("throw", t, i, a);
          });
        }
        a(c.arg);
      }
      var r;
      o(this, "_invoke", {
        value: function (t, n) {
          function callInvokeWithMethodAndArg() {
            return new e(function (e, r) {
              invoke(t, n, e, r);
            });
          }
          return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        }
      });
    }
    function makeInvokeMethod(e, r, n) {
      var o = h;
      return function (i, a) {
        if (o === f) throw Error("Generator is already running");
        if (o === s) {
          if ("throw" === i) throw a;
          return {
            value: t,
            done: !0
          };
        }
        for (n.method = i, n.arg = a;;) {
          var c = n.delegate;
          if (c) {
            var u = maybeInvokeDelegate(c, n);
            if (u) {
              if (u === y) continue;
              return u;
            }
          }
          if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
            if (o === h) throw o = s, n.arg;
            n.dispatchException(n.arg);
          } else "return" === n.method && n.abrupt("return", n.arg);
          o = f;
          var p = tryCatch(e, r, n);
          if ("normal" === p.type) {
            if (o = n.done ? s : l, p.arg === y) continue;
            return {
              value: p.arg,
              done: n.done
            };
          }
          "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
        }
      };
    }
    function maybeInvokeDelegate(e, r) {
      var n = r.method,
        o = e.iterator[n];
      if (o === t) return r.delegate = null, "throw" === n && e.iterator.return && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
      var i = tryCatch(o, e.iterator, r.arg);
      if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
      var a = i.arg;
      return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
    }
    function pushTryEntry(t) {
      var e = {
        tryLoc: t[0]
      };
      1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
    }
    function resetTryEntry(t) {
      var e = t.completion || {};
      e.type = "normal", delete e.arg, t.completion = e;
    }
    function Context(t) {
      this.tryEntries = [{
        tryLoc: "root"
      }], t.forEach(pushTryEntry, this), this.reset(!0);
    }
    function values(e) {
      if (e || "" === e) {
        var r = e[a];
        if (r) return r.call(e);
        if ("function" == typeof e.next) return e;
        if (!isNaN(e.length)) {
          var o = -1,
            i = function next() {
              for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
              return next.value = t, next.done = !0, next;
            };
          return i.next = i;
        }
      }
      throw new TypeError(typeof e + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }), o(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
      var e = "function" == typeof t && t.constructor;
      return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
    }, e.mark = function (t) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
    }, e.awrap = function (t) {
      return {
        __await: t
      };
    }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
      return this;
    }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
      void 0 === i && (i = Promise);
      var a = new AsyncIterator(wrap(t, r, n, o), i);
      return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
        return t.done ? t.value : a.next();
      });
    }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
      return this;
    }), define(g, "toString", function () {
      return "[object Generator]";
    }), e.keys = function (t) {
      var e = Object(t),
        r = [];
      for (var n in e) r.push(n);
      return r.reverse(), function next() {
        for (; r.length;) {
          var t = r.pop();
          if (t in e) return next.value = t, next.done = !1, next;
        }
        return next.done = !0, next;
      };
    }, e.values = values, Context.prototype = {
      constructor: Context,
      reset: function (e) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
      },
      stop: function () {
        this.done = !0;
        var t = this.tryEntries[0].completion;
        if ("throw" === t.type) throw t.arg;
        return this.rval;
      },
      dispatchException: function (e) {
        if (this.done) throw e;
        var r = this;
        function handle(n, o) {
          return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
        }
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var i = this.tryEntries[o],
            a = i.completion;
          if ("root" === i.tryLoc) return handle("end");
          if (i.tryLoc <= this.prev) {
            var c = n.call(i, "catchLoc"),
              u = n.call(i, "finallyLoc");
            if (c && u) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            } else if (c) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            } else {
              if (!u) throw Error("try statement without catch or finally");
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            }
          }
        }
      },
      abrupt: function (t, e) {
        for (var r = this.tryEntries.length - 1; r >= 0; --r) {
          var o = this.tryEntries[r];
          if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
            var i = o;
            break;
          }
        }
        i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
        var a = i ? i.completion : {};
        return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
      },
      complete: function (t, e) {
        if ("throw" === t.type) throw t.arg;
        return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
      },
      finish: function (t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
        }
      },
      catch: function (t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.tryLoc === t) {
            var n = r.completion;
            if ("throw" === n.type) {
              var o = n.arg;
              resetTryEntry(r);
            }
            return o;
          }
        }
        throw Error("illegal catch attempt");
      },
      delegateYield: function (e, r, n) {
        return this.delegate = {
          iterator: values(e),
          resultName: r,
          nextLoc: n
        }, "next" === this.method && (this.arg = t), y;
      }
    }, e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }

  var Versions = {
    CLASSIC: 'classic',
    V1: 'v1'
  };
  var DefaultVersion = Versions.V1;
  var PaddleClassicCDNUrl = 'https://cdn.paddle.com/paddle/paddle.js';
  var PaddleBillingCDNUrl = 'https://cdn.paddle.com/paddle/v2/paddle.js';
  var PaddleClassicInfo = {
    url: PaddleClassicCDNUrl
  };
  var PaddleBillingV1Info = {
    url: PaddleBillingCDNUrl
  };

  function findScript(cdnUrl) {
    return document.querySelector("script[src=\"".concat(cdnUrl, "\"]")) || undefined;
  }
  function injectScript(src) {
    var script = document.createElement('script');
    script.src = src;
    var headOrBody = document.head || document.body;
    if (!headOrBody) {
      throw new Error('Cannot inject Paddle.js. It needs a <head> or <body> element.');
    }
    headOrBody.appendChild(script);
    return script;
  }
  var promiseMap = {
    classic: undefined,
    v1: undefined
  };
  var VersionToPaddleMap = {
    classic: 'PaddleClassic',
    v1: 'PaddleBillingV1'
  };
  function loadFromCDN(version) {
    var _getCDNInfoBasedOnVer;
    var cdnUrl = (_getCDNInfoBasedOnVer = getCDNInfoBasedOnVersion(version)) === null || _getCDNInfoBasedOnVer === void 0 ? void 0 : _getCDNInfoBasedOnVer.url;
    if (!cdnUrl) {
      return;
    }
    // Return promise on re-renders
    var existingPromise = promiseMap[version];
    var paddleInstanceName = VersionToPaddleMap[version];
    if (existingPromise !== undefined) {
      return existingPromise;
    }
    promiseMap[version] = new Promise(function (resolve, reject) {
      if (typeof window === 'undefined') {
        // Return undefined in a server side environment
        resolve(undefined);
        return;
      }
      // Return Paddle instance if it is already initialized
      if (window[paddleInstanceName]) {
        resolve(window[paddleInstanceName]);
        return;
      }
      try {
        // Inject if paddle.js script tag is not found
        var script = findScript(cdnUrl);
        if (!script) {
          script = injectScript(cdnUrl);
        }
        // Wait for `load` event before returning
        script.addEventListener('load', function () {
          if (window[paddleInstanceName]) {
            resolve(window[paddleInstanceName]);
          } else {
            reject(new Error('Paddle.js not available'));
          }
        });
        // Show an error if loading fails
        script.addEventListener('error', function () {
          reject(new Error("Failed to load Paddle.js - ".concat(version)));
        });
      } catch (error) {
        reject(error);
        return;
      }
    });
    return promiseMap[version];
  }
  function getCDNInfoBasedOnVersion(version) {
    if (version === Versions.CLASSIC) {
      return PaddleClassicInfo;
    }
    if (version === Versions.V1) {
      return PaddleBillingV1Info;
    } else {
      console.error('[Paddle] Unknown Paddle Version');
      return;
    }
  }

  var _excluded = ["environment", "version"],
    _excluded2 = ["environment", "version"];
  function initializePaddleBillingV1(options, paddle) {
    var environment = options.environment;
      options.version;
      var rest = _objectWithoutProperties(options, _excluded);
    try {
      if (environment) {
        paddle.Environment.set(environment);
      }
      if (paddle.Initialized) {
        paddle.Update(_objectSpread2({}, rest));
      } else {
        paddle.Initialize(_objectSpread2({}, rest));
      }
    } catch (e) {
      console.warn('[Paddle] Paddle Initialization failed. Please check the inputs', e);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function initializePaddleClassic(options, paddle) {
    var environment = options.environment;
      options.version;
      var rest = _objectWithoutProperties(options, _excluded2);
    try {
      if (environment) {
        paddle.Environment.set(environment);
      }
      paddle.Setup(_objectSpread2({}, rest));
    } catch (e) {
      console.warn('[Paddle] Paddle Initialization failed. Please check the inputs', e);
    }
  }

  // Note: The enums in this file is only for `src`. Typescript will also need it added to the `types` directory for usage.
  exports.CheckoutEventNames = void 0;
  (function (CheckoutEventNames) {
    CheckoutEventNames["CHECKOUT_LOADED"] = "checkout.loaded";
    CheckoutEventNames["CHECKOUT_CLOSED"] = "checkout.closed";
    CheckoutEventNames["CHECKOUT_UPDATED"] = "checkout.updated";
    CheckoutEventNames["CHECKOUT_COMPLETED"] = "checkout.completed";
    CheckoutEventNames["CHECKOUT_ERROR"] = "checkout.error";
    CheckoutEventNames["CHECKOUT_FAILED"] = "checkout.failed";
    CheckoutEventNames["CHECKOUT_ITEMS_UPDATED"] = "checkout.items.updated";
    CheckoutEventNames["CHECKOUT_ITEMS_REMOVED"] = "checkout.items.removed";
    CheckoutEventNames["CHECKOUT_CUSTOMER_CREATED"] = "checkout.customer.created";
    CheckoutEventNames["CHECKOUT_CUSTOMER_UPDATED"] = "checkout.customer.updated";
    CheckoutEventNames["CHECKOUT_CUSTOMER_REMOVED"] = "checkout.customer.removed";
    CheckoutEventNames["CHECKOUT_PAYMENT_SELECTED"] = "checkout.payment.selected";
    CheckoutEventNames["CHECKOUT_PAYMENT_INITIATED"] = "checkout.payment.initiated";
    CheckoutEventNames["CHECKOUT_PAYMENT_FAILED"] = "checkout.payment.failed";
    CheckoutEventNames["CHECKOUT_DISCOUNT_APPLIED"] = "checkout.discount.applied";
    CheckoutEventNames["CHECKOUT_DISCOUNT_REMOVED"] = "checkout.discount.removed";
  })(exports.CheckoutEventNames || (exports.CheckoutEventNames = {}));
  exports.CheckoutEventsTimePeriodInterval = void 0;
  (function (CheckoutEventsTimePeriodInterval) {
    CheckoutEventsTimePeriodInterval["DAY"] = "day";
    CheckoutEventsTimePeriodInterval["WEEK"] = "week";
    CheckoutEventsTimePeriodInterval["MONTH"] = "month";
    CheckoutEventsTimePeriodInterval["YEAR"] = "year";
  })(exports.CheckoutEventsTimePeriodInterval || (exports.CheckoutEventsTimePeriodInterval = {}));
  exports.CheckoutEventsPaymentMethodTypes = void 0;
  (function (CheckoutEventsPaymentMethodTypes) {
    CheckoutEventsPaymentMethodTypes["ALIPAY"] = "alipay";
    CheckoutEventsPaymentMethodTypes["APPLE_PAY"] = "apple-pay";
    CheckoutEventsPaymentMethodTypes["CARD"] = "card";
    CheckoutEventsPaymentMethodTypes["GOOGLE_PAY"] = "google-pay";
    CheckoutEventsPaymentMethodTypes["IDEAL"] = "ideal";
    CheckoutEventsPaymentMethodTypes["PAYPAL"] = "paypal";
    CheckoutEventsPaymentMethodTypes["WIRE_TRANSFER"] = "wire-transfer";
    CheckoutEventsPaymentMethodTypes["NONE"] = "none";
  })(exports.CheckoutEventsPaymentMethodTypes || (exports.CheckoutEventsPaymentMethodTypes = {}));
  exports.CheckoutEventsPaymentMethodCardTypes = void 0;
  (function (CheckoutEventsPaymentMethodCardTypes) {
    CheckoutEventsPaymentMethodCardTypes["AMERICAN_EXPRESS"] = "american_express";
    CheckoutEventsPaymentMethodCardTypes["DINERS_CLUB"] = "diners_club";
    CheckoutEventsPaymentMethodCardTypes["DISCOVER"] = "discover";
    CheckoutEventsPaymentMethodCardTypes["JCB"] = "jcb";
    CheckoutEventsPaymentMethodCardTypes["MADA"] = "mada";
    CheckoutEventsPaymentMethodCardTypes["MAESTRO"] = "maestro";
    CheckoutEventsPaymentMethodCardTypes["MASTER_CARD"] = "mastercard";
    CheckoutEventsPaymentMethodCardTypes["UNION_PAY"] = "union_pay";
    CheckoutEventsPaymentMethodCardTypes["VISA"] = "visa";
    CheckoutEventsPaymentMethodCardTypes["UNKNOWN"] = "unknown";
  })(exports.CheckoutEventsPaymentMethodCardTypes || (exports.CheckoutEventsPaymentMethodCardTypes = {}));
  exports.CheckoutEventsStatus = void 0;
  (function (CheckoutEventsStatus) {
    CheckoutEventsStatus["DRAFT"] = "draft";
    CheckoutEventsStatus["READY"] = "ready";
    CheckoutEventsStatus["COMPLETED"] = "completed";
    CheckoutEventsStatus["BILLED"] = "billed";
    CheckoutEventsStatus["canceled"] = "canceled";
    CheckoutEventsStatus["PAST_DUE"] = "past_due";
  })(exports.CheckoutEventsStatus || (exports.CheckoutEventsStatus = {}));

  function initializePaddle(_x) {
    return _initializePaddle.apply(this, arguments);
  }
  function _initializePaddle() {
    _initializePaddle = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(options) {
      var requestedVersion, paddle;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            requestedVersion = (options === null || options === void 0 ? void 0 : options.version) || DefaultVersion;
            _context.next = 3;
            return loadFromCDN(requestedVersion);
          case 3:
            paddle = _context.sent;
            if (!paddle) {
              _context.next = 9;
              break;
            }
            if (options) {
              if (requestedVersion === Versions.V1) {
                initializePaddleBillingV1(options, paddle);
              } else if (requestedVersion === Versions.CLASSIC) {
                initializePaddleClassic(options, paddle);
              }
            }
            return _context.abrupt("return", paddle);
          case 9:
            console.error('[Paddle] Error Loading Paddle');
            return _context.abrupt("return");
          case 11:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return _initializePaddle.apply(this, arguments);
  }
  function getPaddleInstance() {
    var version = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DefaultVersion;
    if (version === Versions.V1) {
      return window.PaddleBillingV1;
    } else if (version === Versions.CLASSIC) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return window.PaddleClassic;
    } else {
      console.error('[Paddle] Unknown Paddle Version');
      return;
    }
  }

  exports.getPaddleInstance = getPaddleInstance;
  exports.initializePaddle = initializePaddle;

}));
