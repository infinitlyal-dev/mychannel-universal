var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@capacitor/core/dist/index.js
var createCapacitorPlatforms, initPlatforms, CapacitorPlatforms, addPlatform, setPlatform, ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, Plugins, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp;
var init_dist = __esm({
  "node_modules/@capacitor/core/dist/index.js"() {
    createCapacitorPlatforms = (win) => {
      const defaultPlatformMap = /* @__PURE__ */ new Map();
      defaultPlatformMap.set("web", { name: "web" });
      const capPlatforms = win.CapacitorPlatforms || {
        currentPlatform: { name: "web" },
        platforms: defaultPlatformMap
      };
      const addPlatform2 = (name, platform) => {
        capPlatforms.platforms.set(name, platform);
      };
      const setPlatform2 = (name) => {
        if (capPlatforms.platforms.has(name)) {
          capPlatforms.currentPlatform = capPlatforms.platforms.get(name);
        }
      };
      capPlatforms.addPlatform = addPlatform2;
      capPlatforms.setPlatform = setPlatform2;
      return capPlatforms;
    };
    initPlatforms = (win) => win.CapacitorPlatforms = createCapacitorPlatforms(win);
    CapacitorPlatforms = /* @__PURE__ */ initPlatforms(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    addPlatform = CapacitorPlatforms.addPlatform;
    setPlatform = CapacitorPlatforms.setPlatform;
    (function(ExceptionCode2) {
      ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
      ExceptionCode2["Unavailable"] = "UNAVAILABLE";
    })(ExceptionCode || (ExceptionCode = {}));
    CapacitorException = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
      }
    };
    getPlatformId = (win) => {
      var _a, _b;
      if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return "android";
      } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return "ios";
      } else {
        return "web";
      }
    };
    createCapacitor = (win) => {
      var _a, _b, _c, _d, _e;
      const capCustomPlatform = win.CapacitorCustomPlatform || null;
      const cap = win.Capacitor || {};
      const Plugins2 = cap.Plugins = cap.Plugins || {};
      const capPlatforms = win.CapacitorPlatforms;
      const defaultGetPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
      };
      const getPlatform = ((_a = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _a === void 0 ? void 0 : _a.getPlatform) || defaultGetPlatform;
      const defaultIsNativePlatform = () => getPlatform() !== "web";
      const isNativePlatform = ((_b = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _b === void 0 ? void 0 : _b.isNativePlatform) || defaultIsNativePlatform;
      const defaultIsPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
          return true;
        }
        if (getPluginHeader(pluginName)) {
          return true;
        }
        return false;
      };
      const isPluginAvailable = ((_c = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _c === void 0 ? void 0 : _c.isPluginAvailable) || defaultIsPluginAvailable;
      const defaultGetPluginHeader = (pluginName) => {
        var _a2;
        return (_a2 = cap.PluginHeaders) === null || _a2 === void 0 ? void 0 : _a2.find((h2) => h2.name === pluginName);
      };
      const getPluginHeader = ((_d = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _d === void 0 ? void 0 : _d.getPluginHeader) || defaultGetPluginHeader;
      const handleError = (err) => win.console.error(err);
      const pluginMethodNoop = (_target, prop, pluginName) => {
        return Promise.reject(`${pluginName} does not have an implementation of "${prop}".`);
      };
      const registeredPlugins = /* @__PURE__ */ new Map();
      const defaultRegisterPlugin = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
          console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
          return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
          if (!jsImplementation && platform in jsImplementations) {
            jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
          } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
            jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
          }
          return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
          var _a2, _b2;
          if (pluginHeader) {
            const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m2) => prop === m2.name);
            if (methodHeader) {
              if (methodHeader.rtype === "promise") {
                return (options) => cap.nativePromise(pluginName, prop.toString(), options);
              } else {
                return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
              }
            } else if (impl) {
              return (_a2 = impl[prop]) === null || _a2 === void 0 ? void 0 : _a2.bind(impl);
            }
          } else if (impl) {
            return (_b2 = impl[prop]) === null || _b2 === void 0 ? void 0 : _b2.bind(impl);
          } else {
            throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        };
        const createPluginMethodWrapper = (prop) => {
          let remove;
          const wrapper = (...args) => {
            const p2 = loadPluginImplementation().then((impl) => {
              const fn = createPluginMethod(impl, prop);
              if (fn) {
                const p3 = fn(...args);
                remove = p3 === null || p3 === void 0 ? void 0 : p3.remove;
                return p3;
              } else {
                throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
              }
            });
            if (prop === "addListener") {
              p2.remove = async () => remove();
            }
            return p2;
          };
          wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
          Object.defineProperty(wrapper, "name", {
            value: prop,
            writable: false,
            configurable: false
          });
          return wrapper;
        };
        const addListener = createPluginMethodWrapper("addListener");
        const removeListener = createPluginMethodWrapper("removeListener");
        const addListenerNative = (eventName, callback) => {
          const call = addListener({ eventName }, callback);
          const remove = async () => {
            const callbackId = await call;
            removeListener({
              eventName,
              callbackId
            }, callback);
          };
          const p2 = new Promise((resolve) => call.then(() => resolve({ remove })));
          p2.remove = async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          };
          return p2;
        };
        const proxy = new Proxy({}, {
          get(_2, prop) {
            switch (prop) {
              // https://github.com/facebook/react/issues/20030
              case "$$typeof":
                return void 0;
              case "toJSON":
                return () => ({});
              case "addListener":
                return pluginHeader ? addListenerNative : addListener;
              case "removeListener":
                return removeListener;
              default:
                return createPluginMethodWrapper(prop);
            }
          }
        });
        Plugins2[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
          name: pluginName,
          proxy,
          platforms: /* @__PURE__ */ new Set([
            ...Object.keys(jsImplementations),
            ...pluginHeader ? [platform] : []
          ])
        });
        return proxy;
      };
      const registerPlugin2 = ((_e = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _e === void 0 ? void 0 : _e.registerPlugin) || defaultRegisterPlugin;
      if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
      }
      cap.getPlatform = getPlatform;
      cap.handleError = handleError;
      cap.isNativePlatform = isNativePlatform;
      cap.isPluginAvailable = isPluginAvailable;
      cap.pluginMethodNoop = pluginMethodNoop;
      cap.registerPlugin = registerPlugin2;
      cap.Exception = CapacitorException;
      cap.DEBUG = !!cap.DEBUG;
      cap.isLoggingEnabled = !!cap.isLoggingEnabled;
      cap.platform = cap.getPlatform();
      cap.isNative = cap.isNativePlatform();
      return cap;
    };
    initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
    Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    registerPlugin = Capacitor.registerPlugin;
    Plugins = Capacitor.Plugins;
    WebPlugin = class {
      constructor(config) {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
        if (config) {
          console.warn(`Capacitor WebPlugin "${config.name}" config object was deprecated in v3 and will be removed in v4.`);
          this.config = config;
        }
      }
      addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
          this.listeners[eventName] = [];
          firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
          this.addWindowListener(windowListener);
        }
        if (firstListener) {
          this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p2 = Promise.resolve({ remove });
        return p2;
      }
      async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
          this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
      }
      notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          if (retainUntilConsumed) {
            let args = this.retainedEventArguments[eventName];
            if (!args) {
              args = [];
            }
            args.push(data);
            this.retainedEventArguments[eventName] = args;
          }
          return;
        }
        listeners.forEach((listener) => listener(data));
      }
      hasListeners(eventName) {
        return !!this.listeners[eventName].length;
      }
      registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
          registered: false,
          windowEventName,
          pluginEventName,
          handler: (event) => {
            this.notifyListeners(pluginEventName, event);
          }
        };
      }
      unimplemented(msg = "not implemented") {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
      }
      unavailable(msg = "not available") {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
      }
      async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          return;
        }
        const index = listeners.indexOf(listenerFunc);
        this.listeners[eventName].splice(index, 1);
        if (!this.listeners[eventName].length) {
          this.removeWindowListener(this.windowListeners[eventName]);
        }
      }
      addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
      }
      removeWindowListener(handle) {
        if (!handle) {
          return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
      }
      sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
          return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg) => {
          this.notifyListeners(eventName, arg);
        });
      }
    };
    encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    CapacitorCookiesPluginWeb = class extends WebPlugin {
      async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          if (cookie.length <= 0)
            return;
          let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
          key = decode(key).trim();
          value = decode(value).trim();
          cookieMap[key] = value;
        });
        return cookieMap;
      }
      async setCookie(options) {
        try {
          const encodedKey = encode(options.key);
          const encodedValue = encode(options.value);
          const expires = `; expires=${(options.expires || "").replace("expires=", "")}`;
          const path = (options.path || "/").replace("path=", "");
          const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
          document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async deleteCookie(options) {
        try {
          document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearCookies() {
        try {
          const cookies = document.cookie.split(";") || [];
          for (const cookie of cookies) {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearAllCookies() {
        try {
          await this.clearCookies();
        } catch (error) {
          return Promise.reject(error);
        }
      }
    };
    CapacitorCookies = registerPlugin("CapacitorCookies", {
      web: () => new CapacitorCookiesPluginWeb()
    });
    readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    normalizeHttpHeaders = (headers = {}) => {
      const originalKeys = Object.keys(headers);
      const loweredKeys = Object.keys(headers).map((k2) => k2.toLocaleLowerCase());
      const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
      }, {});
      return normalized;
    };
    buildUrlParams = (params, shouldEncode = true) => {
      if (!params)
        return null;
      const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
          item = "";
          value.forEach((str) => {
            encodedValue = shouldEncode ? encodeURIComponent(str) : str;
            item += `${key}=${encodedValue}&`;
          });
          item.slice(0, -1);
        } else {
          encodedValue = shouldEncode ? encodeURIComponent(value) : value;
          item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
      }, "");
      return output.substr(1);
    };
    buildRequestInit = (options, extra = {}) => {
      const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
      const headers = normalizeHttpHeaders(options.headers);
      const type = headers["content-type"] || "";
      if (typeof options.data === "string") {
        output.body = options.data;
      } else if (type.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
          params.set(key, value);
        }
        output.body = params.toString();
      } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
          options.data.forEach((value, key) => {
            form.append(key, value);
          });
        } else {
          for (const key of Object.keys(options.data)) {
            form.append(key, options.data[key]);
          }
        }
        output.body = form;
        const headers2 = new Headers(output.headers);
        headers2.delete("content-type");
        output.headers = headers2;
      } else if (type.includes("application/json") || typeof options.data === "object") {
        output.body = JSON.stringify(options.data);
      }
      return output;
    };
    CapacitorHttpPluginWeb = class extends WebPlugin {
      /**
       * Perform an Http request given a set of options
       * @param options Options to build the HTTP request
       */
      async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        let { responseType = "text" } = response.ok ? options : {};
        if (contentType.includes("application/json")) {
          responseType = "json";
        }
        let data;
        let blob;
        switch (responseType) {
          case "arraybuffer":
          case "blob":
            blob = await response.blob();
            data = await readBlobAsBase64(blob);
            break;
          case "json":
            data = await response.json();
            break;
          case "document":
          case "text":
          default:
            data = await response.text();
        }
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          data,
          headers,
          status: response.status,
          url: response.url
        };
      }
      /**
       * Perform an Http GET request given a set of options
       * @param options Options to build the HTTP request
       */
      async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
      }
      /**
       * Perform an Http POST request given a set of options
       * @param options Options to build the HTTP request
       */
      async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
      }
      /**
       * Perform an Http PUT request given a set of options
       * @param options Options to build the HTTP request
       */
      async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
      }
      /**
       * Perform an Http PATCH request given a set of options
       * @param options Options to build the HTTP request
       */
      async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
      }
      /**
       * Perform an Http DELETE request given a set of options
       * @param options Options to build the HTTP request
       */
      async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
      }
    };
    CapacitorHttp = registerPlugin("CapacitorHttp", {
      web: () => new CapacitorHttpPluginWeb()
    });
  }
});

// node_modules/@capacitor/app-launcher/dist/esm/web.js
var web_exports = {};
__export(web_exports, {
  AppLauncherWeb: () => AppLauncherWeb
});
var AppLauncherWeb;
var init_web = __esm({
  "node_modules/@capacitor/app-launcher/dist/esm/web.js"() {
    init_dist();
    AppLauncherWeb = class extends WebPlugin {
      async canOpenUrl(_options) {
        return { value: true };
      }
      async openUrl(options) {
        window.open(options.url, "_blank");
        return { completed: true };
      }
    };
  }
});

// node_modules/@capacitor/local-notifications/dist/esm/web.js
var web_exports2 = {};
__export(web_exports2, {
  LocalNotificationsWeb: () => LocalNotificationsWeb
});
var LocalNotificationsWeb;
var init_web2 = __esm({
  "node_modules/@capacitor/local-notifications/dist/esm/web.js"() {
    init_dist();
    LocalNotificationsWeb = class extends WebPlugin {
      constructor() {
        super(...arguments);
        this.pending = [];
        this.deliveredNotifications = [];
        this.hasNotificationSupport = () => {
          if (!("Notification" in window) || !Notification.requestPermission) {
            return false;
          }
          if (Notification.permission !== "granted") {
            try {
              new Notification("");
            } catch (e2) {
              if (e2.name == "TypeError") {
                return false;
              }
            }
          }
          return true;
        };
      }
      async getDeliveredNotifications() {
        const deliveredSchemas = [];
        for (const notification of this.deliveredNotifications) {
          const deliveredSchema = {
            title: notification.title,
            id: parseInt(notification.tag),
            body: notification.body
          };
          deliveredSchemas.push(deliveredSchema);
        }
        return {
          notifications: deliveredSchemas
        };
      }
      async removeDeliveredNotifications(delivered) {
        for (const toRemove of delivered.notifications) {
          const found = this.deliveredNotifications.find((n2) => n2.tag === String(toRemove.id));
          found === null || found === void 0 ? void 0 : found.close();
          this.deliveredNotifications = this.deliveredNotifications.filter(() => !found);
        }
      }
      async removeAllDeliveredNotifications() {
        for (const notification of this.deliveredNotifications) {
          notification.close();
        }
        this.deliveredNotifications = [];
      }
      async createChannel() {
        throw this.unimplemented("Not implemented on web.");
      }
      async deleteChannel() {
        throw this.unimplemented("Not implemented on web.");
      }
      async listChannels() {
        throw this.unimplemented("Not implemented on web.");
      }
      async schedule(options) {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        for (const notification of options.notifications) {
          this.sendNotification(notification);
        }
        return {
          notifications: options.notifications.map((notification) => ({
            id: notification.id
          }))
        };
      }
      async getPending() {
        return {
          notifications: this.pending
        };
      }
      async registerActionTypes() {
        throw this.unimplemented("Not implemented on web.");
      }
      async cancel(pending) {
        this.pending = this.pending.filter((notification) => !pending.notifications.find((n2) => n2.id === notification.id));
      }
      async areEnabled() {
        const { display } = await this.checkPermissions();
        return {
          value: display === "granted"
        };
      }
      async changeExactNotificationSetting() {
        throw this.unimplemented("Not implemented on web.");
      }
      async checkExactNotificationSetting() {
        throw this.unimplemented("Not implemented on web.");
      }
      async requestPermissions() {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        const display = this.transformNotificationPermission(await Notification.requestPermission());
        return { display };
      }
      async checkPermissions() {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        const display = this.transformNotificationPermission(Notification.permission);
        return { display };
      }
      transformNotificationPermission(permission) {
        switch (permission) {
          case "granted":
            return "granted";
          case "denied":
            return "denied";
          default:
            return "prompt";
        }
      }
      sendPending() {
        var _a;
        const toRemove = [];
        const now = (/* @__PURE__ */ new Date()).getTime();
        for (const notification of this.pending) {
          if (((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) && notification.schedule.at.getTime() <= now) {
            this.buildNotification(notification);
            toRemove.push(notification);
          }
        }
        this.pending = this.pending.filter((notification) => !toRemove.find((n2) => n2 === notification));
      }
      sendNotification(notification) {
        var _a;
        if ((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) {
          const diff = notification.schedule.at.getTime() - (/* @__PURE__ */ new Date()).getTime();
          this.pending.push(notification);
          setTimeout(() => {
            this.sendPending();
          }, diff);
          return;
        }
        this.buildNotification(notification);
      }
      buildNotification(notification) {
        const localNotification = new Notification(notification.title, {
          body: notification.body,
          tag: String(notification.id)
        });
        localNotification.addEventListener("click", this.onClick.bind(this, notification), false);
        localNotification.addEventListener("show", this.onShow.bind(this, notification), false);
        localNotification.addEventListener("close", () => {
          this.deliveredNotifications = this.deliveredNotifications.filter(() => !this);
        }, false);
        this.deliveredNotifications.push(localNotification);
        return localNotification;
      }
      onClick(notification) {
        const data = {
          actionId: "tap",
          notification
        };
        this.notifyListeners("localNotificationActionPerformed", data);
      }
      onShow(notification) {
        this.notifyListeners("localNotificationReceived", notification);
      }
    };
  }
});

// node_modules/@capacitor/preferences/dist/esm/web.js
var web_exports3 = {};
__export(web_exports3, {
  PreferencesWeb: () => PreferencesWeb
});
var PreferencesWeb;
var init_web3 = __esm({
  "node_modules/@capacitor/preferences/dist/esm/web.js"() {
    init_dist();
    PreferencesWeb = class extends WebPlugin {
      constructor() {
        super(...arguments);
        this.group = "CapacitorStorage";
      }
      async configure({ group }) {
        if (typeof group === "string") {
          this.group = group;
        }
      }
      async get(options) {
        const value = this.impl.getItem(this.applyPrefix(options.key));
        return { value };
      }
      async set(options) {
        this.impl.setItem(this.applyPrefix(options.key), options.value);
      }
      async remove(options) {
        this.impl.removeItem(this.applyPrefix(options.key));
      }
      async keys() {
        const keys = this.rawKeys().map((k2) => k2.substring(this.prefix.length));
        return { keys };
      }
      async clear() {
        for (const key of this.rawKeys()) {
          this.impl.removeItem(key);
        }
      }
      async migrate() {
        var _a;
        const migrated = [];
        const existing = [];
        const oldprefix = "_cap_";
        const keys = Object.keys(this.impl).filter((k2) => k2.indexOf(oldprefix) === 0);
        for (const oldkey of keys) {
          const key = oldkey.substring(oldprefix.length);
          const value = (_a = this.impl.getItem(oldkey)) !== null && _a !== void 0 ? _a : "";
          const { value: currentValue } = await this.get({ key });
          if (typeof currentValue === "string") {
            existing.push(key);
          } else {
            await this.set({ key, value });
            migrated.push(key);
          }
        }
        return { migrated, existing };
      }
      async removeOld() {
        const oldprefix = "_cap_";
        const keys = Object.keys(this.impl).filter((k2) => k2.indexOf(oldprefix) === 0);
        for (const oldkey of keys) {
          this.impl.removeItem(oldkey);
        }
      }
      get impl() {
        return window.localStorage;
      }
      get prefix() {
        return this.group === "NativeStorage" ? "" : `${this.group}.`;
      }
      rawKeys() {
        return Object.keys(this.impl).filter((k2) => k2.indexOf(this.prefix) === 0);
      }
      applyPrefix(key) {
        return this.prefix + key;
      }
    };
  }
});

// node_modules/lit-html/lit-html.js
var t = globalThis;
var i = (t2) => t2;
var s = t.trustedTypes;
var e = s ? s.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0;
var h = "$lit$";
var o = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n = "?" + o;
var r = `<${n}>`;
var l = document;
var c = () => l.createComment("");
var a = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2;
var u = Array.isArray;
var d = (t2) => u(t2) || "function" == typeof t2?.[Symbol.iterator];
var f = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y = /^(?:script|style|textarea|title)$/i;
var x = (t2) => (i2, ...s2) => ({ _$litType$: t2, strings: i2, values: s2 });
var b = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l.createTreeWalker(l, 129);
function V(t2, i2) {
  if (!u(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e ? e.createHTML(i2) : i2;
}
var N = (t2, i2) => {
  const s2 = t2.length - 1, e2 = [];
  let n2, l2 = 2 === i2 ? "<svg>" : 3 === i2 ? "<math>" : "", c2 = v;
  for (let i3 = 0; i3 < s2; i3++) {
    const s3 = t2[i3];
    let a2, u2, d2 = -1, f2 = 0;
    for (; f2 < s3.length && (c2.lastIndex = f2, u2 = c2.exec(s3), null !== u2); ) f2 = c2.lastIndex, c2 === v ? "!--" === u2[1] ? c2 = _ : void 0 !== u2[1] ? c2 = m : void 0 !== u2[2] ? (y.test(u2[2]) && (n2 = RegExp("</" + u2[2], "g")), c2 = p) : void 0 !== u2[3] && (c2 = p) : c2 === p ? ">" === u2[0] ? (c2 = n2 ?? v, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? p : '"' === u2[3] ? $ : g) : c2 === $ || c2 === g ? c2 = p : c2 === _ || c2 === m ? c2 = v : (c2 = p, n2 = void 0);
    const x2 = c2 === p && t2[i3 + 1].startsWith("/>") ? " " : "";
    l2 += c2 === v ? s3 + r : d2 >= 0 ? (e2.push(a2), s3.slice(0, d2) + h + s3.slice(d2) + o + x2) : s3 + o + (-2 === d2 ? i3 : x2);
  }
  return [V(t2, l2 + (t2[s2] || "<?>") + (2 === i2 ? "</svg>" : 3 === i2 ? "</math>" : "")), e2];
};
var S = class _S {
  constructor({ strings: t2, _$litType$: i2 }, e2) {
    let r2;
    this.parts = [];
    let l2 = 0, a2 = 0;
    const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = N(t2, i2);
    if (this.el = _S.createElement(f2, e2), P.currentNode = this.el.content, 2 === i2 || 3 === i2) {
      const t3 = this.el.content.firstChild;
      t3.replaceWith(...t3.childNodes);
    }
    for (; null !== (r2 = P.nextNode()) && d2.length < u2; ) {
      if (1 === r2.nodeType) {
        if (r2.hasAttributes()) for (const t3 of r2.getAttributeNames()) if (t3.endsWith(h)) {
          const i3 = v2[a2++], s2 = r2.getAttribute(t3).split(o), e3 = /([.?@])?(.*)/.exec(i3);
          d2.push({ type: 1, index: l2, name: e3[2], strings: s2, ctor: "." === e3[1] ? I : "?" === e3[1] ? L : "@" === e3[1] ? z : H }), r2.removeAttribute(t3);
        } else t3.startsWith(o) && (d2.push({ type: 6, index: l2 }), r2.removeAttribute(t3));
        if (y.test(r2.tagName)) {
          const t3 = r2.textContent.split(o), i3 = t3.length - 1;
          if (i3 > 0) {
            r2.textContent = s ? s.emptyScript : "";
            for (let s2 = 0; s2 < i3; s2++) r2.append(t3[s2], c()), P.nextNode(), d2.push({ type: 2, index: ++l2 });
            r2.append(t3[i3], c());
          }
        }
      } else if (8 === r2.nodeType) if (r2.data === n) d2.push({ type: 2, index: l2 });
      else {
        let t3 = -1;
        for (; -1 !== (t3 = r2.data.indexOf(o, t3 + 1)); ) d2.push({ type: 7, index: l2 }), t3 += o.length - 1;
      }
      l2++;
    }
  }
  static createElement(t2, i2) {
    const s2 = l.createElement("template");
    return s2.innerHTML = t2, s2;
  }
};
function M(t2, i2, s2 = t2, e2) {
  if (i2 === E) return i2;
  let h2 = void 0 !== e2 ? s2._$Co?.[e2] : s2._$Cl;
  const o2 = a(i2) ? void 0 : i2._$litDirective$;
  return h2?.constructor !== o2 && (h2?._$AO?.(false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ??= [])[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i2 = M(t2, h2._$AS(t2, i2.values), h2, e2)), i2;
}
var R = class {
  constructor(t2, i2) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i2;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    const { el: { content: i2 }, parts: s2 } = this._$AD, e2 = (t2?.creationScope ?? l).importNode(i2, true);
    P.currentNode = e2;
    let h2 = P.nextNode(), o2 = 0, n2 = 0, r2 = s2[0];
    for (; void 0 !== r2; ) {
      if (o2 === r2.index) {
        let i3;
        2 === r2.type ? i3 = new k(h2, h2.nextSibling, this, t2) : 1 === r2.type ? i3 = new r2.ctor(h2, r2.name, r2.strings, this, t2) : 6 === r2.type && (i3 = new Z(h2, this, t2)), this._$AV.push(i3), r2 = s2[++n2];
      }
      o2 !== r2?.index && (h2 = P.nextNode(), o2++);
    }
    return P.currentNode = l, e2;
  }
  p(t2) {
    let i2 = 0;
    for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i2), i2 += s2.strings.length - 2) : s2._$AI(t2[i2])), i2++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t2, i2, s2, e2) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i2, this._$AM = s2, this.options = e2, this._$Cv = e2?.isConnected ?? true;
  }
  get parentNode() {
    let t2 = this._$AA.parentNode;
    const i2 = this._$AM;
    return void 0 !== i2 && 11 === t2?.nodeType && (t2 = i2.parentNode), t2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, i2 = this) {
    t2 = M(this, t2, i2), a(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== E && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : d(t2) ? this.k(t2) : this._(t2);
  }
  O(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  T(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
  }
  _(t2) {
    this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(l.createTextNode(t2)), this._$AH = t2;
  }
  $(t2) {
    const { values: i2, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = S.createElement(V(s2.h, s2.h[0]), this.options)), s2);
    if (this._$AH?._$AD === e2) this._$AH.p(i2);
    else {
      const t3 = new R(e2, this), s3 = t3.u(this.options);
      t3.p(i2), this.T(s3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let i2 = C.get(t2.strings);
    return void 0 === i2 && C.set(t2.strings, i2 = new S(t2)), i2;
  }
  k(t2) {
    u(this._$AH) || (this._$AH = [], this._$AR());
    const i2 = this._$AH;
    let s2, e2 = 0;
    for (const h2 of t2) e2 === i2.length ? i2.push(s2 = new _k(this.O(c()), this.O(c()), this, this.options)) : s2 = i2[e2], s2._$AI(h2), e2++;
    e2 < i2.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i2.length = e2);
  }
  _$AR(t2 = this._$AA.nextSibling, s2) {
    for (this._$AP?.(false, true, s2); t2 !== this._$AB; ) {
      const s3 = i(t2).nextSibling;
      i(t2).remove(), t2 = s3;
    }
  }
  setConnected(t2) {
    void 0 === this._$AM && (this._$Cv = t2, this._$AP?.(t2));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t2, i2, s2, e2, h2) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i2, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = A;
  }
  _$AI(t2, i2 = this, s2, e2) {
    const h2 = this.strings;
    let o2 = false;
    if (void 0 === h2) t2 = M(this, t2, i2, 0), o2 = !a(t2) || t2 !== this._$AH && t2 !== E, o2 && (this._$AH = t2);
    else {
      const e3 = t2;
      let n2, r2;
      for (t2 = h2[0], n2 = 0; n2 < h2.length - 1; n2++) r2 = M(this, e3[s2 + n2], i2, n2), r2 === E && (r2 = this._$AH[n2]), o2 ||= !a(r2) || r2 !== this._$AH[n2], r2 === A ? t2 = A : t2 !== A && (t2 += (r2 ?? "") + h2[n2 + 1]), this._$AH[n2] = r2;
    }
    o2 && !e2 && this.j(t2);
  }
  j(t2) {
    t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === A ? void 0 : t2;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    this.element.toggleAttribute(this.name, !!t2 && t2 !== A);
  }
};
var z = class extends H {
  constructor(t2, i2, s2, e2, h2) {
    super(t2, i2, s2, e2, h2), this.type = 5;
  }
  _$AI(t2, i2 = this) {
    if ((t2 = M(this, t2, i2, 0) ?? A) === E) return;
    const s2 = this._$AH, e2 = t2 === A && s2 !== A || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== A && (s2 === A || e2);
    e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t2) : this._$AH.handleEvent(t2);
  }
};
var Z = class {
  constructor(t2, i2, s2) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i2, this.options = s2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    M(this, t2);
  }
};
var B = t.litHtmlPolyfillSupport;
B?.(S, k), (t.litHtmlVersions ??= []).push("3.3.2");
var D = (t2, i2, s2) => {
  const e2 = s2?.renderBefore ?? i2;
  let h2 = e2._$litPart$;
  if (void 0 === h2) {
    const t3 = s2?.renderBefore ?? null;
    e2._$litPart$ = h2 = new k(i2.insertBefore(c(), t3), t3, void 0, s2 ?? {});
  }
  return h2._$AI(t2), h2;
};

// src/components/button.ts
var McButton = class extends HTMLElement {
  static observedAttributes = ["variant", "disabled", "label"];
  get variant() {
    const v2 = this.getAttribute("variant");
    return v2 === "ghost" || v2 === "danger" ? v2 : "primary";
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  attributeChangedCallback() {
    this.render();
  }
  connectedCallback() {
    this.render();
    this.addEventListener("click", (e2) => {
      if (this.disabled) e2.stopPropagation();
    });
  }
  render() {
    const label = this.getAttribute("label") ?? this.textContent?.trim() ?? "";
    const cls = this.variant === "ghost" ? "mc-btn mc-btn--ghost" : this.variant === "danger" ? "mc-btn mc-btn--danger" : "mc-btn mc-btn--primary";
    D(
      b`
        <button class="${cls}" ?disabled=${this.disabled} part="control">
          ${label}
        </button>
      `,
      this
    );
  }
};
if (!customElements.get("mc-button")) {
  customElements.define("mc-button", McButton);
}

// src/components/top-bar.ts
var McTopBar = class extends HTMLElement {
  static observedAttributes = ["title", "show-back", "show-settings"];
  connectedCallback() {
    this.render();
    this.addEventListener("click", (e2) => {
      const t2 = e2.target;
      if (t2.closest('[data-action="back"]')) {
        this.dispatchEvent(new CustomEvent("mc-back", { bubbles: true, composed: true }));
      }
      if (t2.closest('[data-action="settings"]')) {
        this.dispatchEvent(new CustomEvent("mc-settings", { bubbles: true, composed: true }));
      }
    });
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const title = this.getAttribute("title") ?? "";
    const showBack = this.hasAttribute("show-back");
    const showSettings = this.hasAttribute("show-settings");
    D(
      b`
        <header class="mc-topbar">
          <div class="mc-topbar__left">
            ${showBack ? b`<button type="button" class="mc-topbar__icon" data-action="back" aria-label="Back">←</button>` : b`<span class="mc-topbar__mark">MC</span>`}
          </div>
          <div class="mc-topbar__title">${title}</div>
          <div class="mc-topbar__right">
            ${showSettings ? b`<button type="button" class="mc-topbar__icon" data-action="settings" aria-label="Settings">⚙</button>` : ""}
          </div>
        </header>
      `,
      this
    );
  }
};
if (!customElements.get("mc-top-bar")) {
  customElements.define("mc-top-bar", McTopBar);
}

// src/components/progress-bar.ts
var McProgressBar = class extends HTMLElement {
  static observedAttributes = ["value"];
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const raw = Number(this.getAttribute("value") ?? "0");
    const value = Math.max(0, Math.min(1, Number.isFinite(raw) ? raw : 0));
    D(
      b`
        <div class="mc-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value * 100)}">
          <div class="mc-progress__fill" style="width:${value * 100}%"></div>
        </div>
      `,
      this
    );
  }
};
if (!customElements.get("mc-progress-bar")) {
  customElements.define("mc-progress-bar", McProgressBar);
}

// src/components/poster-card.ts
var McPosterCard = class extends HTMLElement {
  static observedAttributes = ["title", "image", "selected", "square"];
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const title = this.getAttribute("title") ?? "";
    const image = this.getAttribute("image") ?? "";
    const selected = this.hasAttribute("selected");
    const square = this.hasAttribute("square");
    const ratioClass = square ? "mc-poster mc-poster--square" : "mc-poster";
    D(
      b`
        <button type="button" class="${ratioClass} ${selected ? "mc-poster--selected" : ""}" aria-pressed="${selected}">
          <img src="${image}" alt="" loading="lazy" />
          <span class="mc-poster__cap">${title}</span>
        </button>
      `,
      this
    );
  }
};
if (!customElements.get("mc-poster-card")) {
  customElements.define("mc-poster-card", McPosterCard);
}

// src/components/streamer-tile.ts
var McStreamerTile = class extends HTMLElement {
  static observedAttributes = ["name", "logo", "selected"];
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const name = this.getAttribute("name") ?? "";
    const logo = this.getAttribute("logo") ?? "";
    const selected = this.hasAttribute("selected");
    D(
      b`
        <button type="button" class="mc-streamer ${selected ? "mc-streamer--selected" : ""}" aria-pressed="${selected}">
          <div class="mc-streamer__logo">${logo ? b`<img src="${logo}" alt="" />` : b`<span class="mc-streamer__mono">${name.slice(0, 1)}</span>`}</div>
          <div class="mc-streamer__name">${name}</div>
        </button>
      `,
      this
    );
  }
};
if (!customElements.get("mc-streamer-tile")) {
  customElements.define("mc-streamer-tile", McStreamerTile);
}

// src/components/modal.ts
var McModal = class extends HTMLElement {
  static observedAttributes = ["open", "title"];
  connectedCallback() {
    this.render();
    this.addEventListener("click", (e2) => {
      const t2 = e2.target;
      if (t2.closest("[data-close]")) {
        this.removeAttribute("open");
        this.dispatchEvent(new CustomEvent("mc-close", { bubbles: true, composed: true }));
      }
    });
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const open = this.hasAttribute("open");
    const title = this.getAttribute("title") ?? "";
    D(
      b`
        <div class="mc-modal ${open ? "mc-modal--open" : ""}" aria-hidden="${!open}">
          <div class="mc-modal__backdrop" data-close></div>
          <div class="mc-modal__panel" role="dialog" aria-modal="true" aria-label="${title}">
            <div class="mc-modal__head">
              <div class="mc-modal__title">${title}</div>
              <button type="button" class="mc-modal__x" data-close aria-label="Close">×</button>
            </div>
            <div class="mc-modal__body"><slot></slot></div>
          </div>
        </div>
      `,
      this
    );
  }
};
if (!customElements.get("mc-modal")) {
  customElements.define("mc-modal", McModal);
}

// node_modules/@capacitor/app-launcher/dist/esm/index.js
init_dist();
var AppLauncher = registerPlugin("AppLauncher", {
  web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m2) => new m2.AppLauncherWeb())
});

// node_modules/@capacitor/local-notifications/dist/esm/index.js
init_dist();

// node_modules/@capacitor/local-notifications/dist/esm/definitions.js
var Weekday;
(function(Weekday2) {
  Weekday2[Weekday2["Sunday"] = 1] = "Sunday";
  Weekday2[Weekday2["Monday"] = 2] = "Monday";
  Weekday2[Weekday2["Tuesday"] = 3] = "Tuesday";
  Weekday2[Weekday2["Wednesday"] = 4] = "Wednesday";
  Weekday2[Weekday2["Thursday"] = 5] = "Thursday";
  Weekday2[Weekday2["Friday"] = 6] = "Friday";
  Weekday2[Weekday2["Saturday"] = 7] = "Saturday";
})(Weekday || (Weekday = {}));

// node_modules/@capacitor/local-notifications/dist/esm/index.js
var LocalNotifications = registerPlugin("LocalNotifications", {
  web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m2) => new m2.LocalNotificationsWeb())
});

// ../shared/constants.ts
var API_BASE = "/api";

// src/lib/library-api.ts
var LibraryApiError = class extends Error {
  code;
  status;
  constructor(code, message, status) {
    super(message);
    this.name = "LibraryApiError";
    this.code = code;
    this.status = status;
  }
};
async function getJson(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      credentials: "same-origin"
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "network error";
    throw new LibraryApiError("network_error", message);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new LibraryApiError("invalid_json", "response was not valid JSON", response.status);
  }
  const data = body;
  if (!response.ok || !data?.success) {
    const code = data?.error?.code ?? `http_${response.status}`;
    const message = data?.error?.message ?? response.statusText ?? "request failed";
    throw new LibraryApiError(code, message, response.status);
  }
  return data;
}
function fetchProviders(region) {
  const url = region ? `${API_BASE}/library/providers?region=${encodeURIComponent(region)}` : `${API_BASE}/library/providers`;
  return getJson(url);
}
function fetchTitle(tmdbType, tmdbId) {
  return getJson(`${API_BASE}/title/${tmdbType}/${tmdbId}`);
}

// src/lib/library-cache.ts
var TITLE_DETAIL_CAP = 64;
var providersByRegion = /* @__PURE__ */ new Map();
var providersAny = null;
var titleDetails = /* @__PURE__ */ new Map();
function hashTitleKey(tmdbType, tmdbId) {
  return `${tmdbType}:${tmdbId}`;
}
function touch(map, key) {
  if (!map.has(key)) return void 0;
  const value = map.get(key);
  map.delete(key);
  map.set(key, value);
  return value;
}
function setWithCap(map, key, value, cap) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > cap) {
    const oldest = map.keys().next().value;
    if (oldest === void 0) break;
    map.delete(oldest);
  }
}
function getCachedProviders(region) {
  if (region) {
    return providersByRegion.get(region);
  }
  return providersAny ?? void 0;
}
function setCachedProviders(region, providers) {
  if (region) {
    providersByRegion.set(region, providers);
  } else {
    providersAny = providers;
  }
}
function getCachedTitleDetail(tmdbType, tmdbId) {
  return touch(titleDetails, hashTitleKey(tmdbType, tmdbId));
}
function setCachedTitleDetail(tmdbType, tmdbId, detail) {
  setWithCap(titleDetails, hashTitleKey(tmdbType, tmdbId), detail, TITLE_DETAIL_CAP);
}

// src/screens/splash.ts
function renderSplash(ctx) {
  return b`
    <div class="screen" @click=${() => ctx.navigate("welcome")}>
      <div class="wordmark">MC</div>
      <p style="line-height:1.5;margin-top:24px;">Your own TV channel.<br />Built from your streamers, your shows, your week.</p>
      <p class="muted" style="margin-top:32px;">tap to begin</p>
    </div>
  `;
}

// src/screens/welcome.ts
function renderWelcome(ctx) {
  return b`
    <div class="screen">
      <h1 style="margin-top:0;">Let's build your channel.</h1>
      <ul style="line-height:1.6;padding-left:18px;">
        <li>📺 Pick your streamers</li>
        <li>🎬 Pick shows you love</li>
        <li>⏰ Pick when you watch</li>
      </ul>
      <p class="muted">About 2 minutes.</p>
      <mc-button label="Let's Build It →" @click=${() => ctx.navigate("region")}></mc-button>
    </div>
  `;
}

// src/screens/region.ts
function renderRegion(ctx) {
  const pick = async (r2) => {
    await ctx.patch({ region: r2 });
    ctx.navigate("wizard/streamers");
  };
  return b`
    <div class="screen">
      <h2>Where are you?</h2>
      <div class="grid-2" style="margin-top:16px;">
        <button class="card-select" @click=${() => pick("ZA")}>🇿🇦 South Africa</button>
        <button class="card-select" @click=${() => pick("US")}>🇺🇸 United States</button>
      </div>
      <p class="muted" style="margin-top:16px;">More countries coming.</p>
    </div>
  `;
}

// src/screens/streamers.ts
function renderStreamers(ctx) {
  const list = ctx.streamers.filter((s2) => s2.regions.includes(ctx.state.region));
  const selected = new Set(ctx.state.streamers);
  const toggle = async (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    await ctx.patch({ streamers: [...next] });
  };
  const count = ctx.state.streamers.length;
  return b`
    <div class="screen layout">
      <div class="layout__body">
        <h2>Wizard 1/4 — Streamers</h2>
        <p class="muted">${count} selected</p>
        <div class="grid-3" style="margin-top:12px;">
          ${list.map(
    (s2) => b`
              <mc-streamer-tile
                name=${s2.name}
                logo=${s2.logo}
                ?selected=${selected.has(s2.id)}
                @click=${() => toggle(s2.id)}
              ></mc-streamer-tile>
            `
  )}
        </div>
      </div>
      <mc-button
        label="Continue"
        ?disabled=${count < 1}
        @click=${() => ctx.navigate("wizard/shows")}
      ></mc-button>
    </div>
  `;
}

// src/screens/shows.ts
var showQuery = "";
function showMatchesStreamers(show, region, picks) {
  const prov = show.providers[region] ?? [];
  return picks.some((p2) => prov.includes(p2));
}
function renderShows(ctx, fromTab) {
  const selected = new Set(ctx.state.shows);
  const filtered = ctx.catalogue.filter((s2) => showMatchesStreamers(s2, ctx.state.region, ctx.state.streamers)).filter((s2) => s2.title.toLowerCase().includes(showQuery.toLowerCase()));
  const toggle = async (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    await ctx.patch({ shows: [...next] });
  };
  const count = ctx.state.shows.length;
  const onInput = (e2) => {
    showQuery = e2.target.value;
    ctx.redraw();
  };
  return b`
    <div class="screen layout">
      <div class="layout__body">
        <h2>${fromTab ? "Add shows" : "Wizard 2/4 \u2014 Shows"}</h2>
        <input class="search" placeholder="Search titles" .value=${showQuery} @input=${onInput} />
        <p class="muted">${count} selected (min 6)</p>
        <div class="grid-3">
          ${filtered.map(
    (s2) => b`
              <mc-poster-card
                title=${s2.title}
                image=${s2.posterUrl}
                ?selected=${selected.has(s2.id)}
                @click=${() => toggle(s2.id)}
              ></mc-poster-card>
            `
  )}
        </div>
      </div>
      <mc-button
        label=${fromTab ? "Done" : "Continue"}
        ?disabled=${count < 6}
        @click=${() => ctx.navigate(fromTab ? "shows-picks" : "wizard/times")}
      ></mc-button>
    </div>
  `;
}

// src/lib/slots.ts
var UI_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
var BAND_LABEL = {
  early: "Early",
  afternoon: "Afternoon",
  evening: "Evening",
  late: "Late"
};
function bandWindow(band) {
  switch (band) {
    case "early":
      return { startTime: "06:00", endTime: "11:59" };
    case "afternoon":
      return { startTime: "12:00", endTime: "16:59" };
    case "evening":
      return { startTime: "17:00", endTime: "21:59" };
    case "late":
      return { startTime: "22:00", endTime: "23:59" };
  }
}
function toggleSlot(slots, day, band) {
  const i2 = slots.findIndex((s2) => s2.dayOfWeek === day && s2.band === band);
  if (i2 >= 0) return slots.filter((_2, idx) => idx !== i2);
  return [...slots, { dayOfWeek: day, band }];
}
function presetWeeknights() {
  const days = [1, 2, 3, 4, 5];
  return days.flatMap((d2) => [{ dayOfWeek: d2, band: "evening" }]);
}
function presetWeekends() {
  return [
    { dayOfWeek: 0, band: "evening" },
    { dayOfWeek: 6, band: "evening" }
  ];
}
function presetEveryNight() {
  const days = [0, 1, 2, 3, 4, 5, 6];
  return days.map((d2) => ({ dayOfWeek: d2, band: "evening" }));
}

// src/lib/web-session.ts
var DRAFT_SLOTS = "mychannel_draft_slots_v1";
function loadDraftSlotsJson() {
  try {
    return sessionStorage.getItem(DRAFT_SLOTS);
  } catch {
    return null;
  }
}
function saveDraftSlotsJson(raw) {
  try {
    sessionStorage.setItem(DRAFT_SLOTS, raw);
  } catch {
  }
}
function clearDraftSlots() {
  try {
    sessionStorage.removeItem(DRAFT_SLOTS);
  } catch {
  }
}

// src/screens/times.ts
var DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function readSlots(ctx) {
  const raw = loadDraftSlotsJson();
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
    }
  }
  return ctx.session.draftSlots;
}
function writeSlots(ctx, slots) {
  ctx.session.draftSlots = slots;
  saveDraftSlotsJson(JSON.stringify(slots));
}
function renderTimes(ctx) {
  const bands = ["early", "afternoon", "evening", "late"];
  const slots = readSlots(ctx);
  const has = (d2, b2) => slots.some((s2) => s2.dayOfWeek === d2 && s2.band === b2);
  const click = (d2, b2) => {
    writeSlots(ctx, toggleSlot(slots, d2, b2));
    ctx.redraw();
  };
  const applyPreset = (next) => {
    writeSlots(ctx, next);
    ctx.redraw();
  };
  const count = slots.length;
  return b`
    <div class="screen layout">
      <div class="layout__body">
        <h2>Wizard 3/4 — Times</h2>
        <p class="muted">${count} slots (min 3)</p>
        <div class="pill-row">
          <button type="button" @click=${() => applyPreset(presetWeeknights())}>Weeknights only</button>
          <button type="button" @click=${() => applyPreset(presetWeekends())}>Weekends</button>
          <button type="button" @click=${() => applyPreset(presetEveryNight())}>Every night</button>
          <button type="button" @click=${() => applyPreset([])}>Clear all</button>
        </div>
        <div style="display:grid;grid-template-columns:64px repeat(7,minmax(0,1fr));gap:4px;align-items:center;">
          <div></div>
          ${UI_DAY_ORDER.map((d2) => b`<div class="muted" style="text-align:center;font-size:0.75rem;">${DAY_SHORT[d2]}</div>`)}
          ${bands.map((b2) => b`
            <div class="muted" style="font-size:0.75rem;">${BAND_LABEL[b2]}</div>
            ${UI_DAY_ORDER.map(
    (d2) => b`
                <button
                  type="button"
                  class="card-select"
                  style="padding:8px 4px;font-size:0.7rem;"
                  aria-pressed=${has(d2, b2)}
                  @click=${() => click(d2, b2)}
                >
                  ${has(d2, b2) ? "\u25CF" : "\u25CB"}
                </button>
              `
  )}
          `)}
        </div>
      </div>
      <mc-button label="Continue" ?disabled=${count < 3} @click=${() => ctx.navigate("wizard/preview")}></mc-button>
    </div>
  `;
}

// src/lib/deep-link.ts
init_dist();

// ../data/streamers.json
var streamers_default = [
  {
    id: "netflix",
    name: "Netflix",
    shortName: "Netflix",
    logo: "assets/streamers/netflix.png",
    regions: ["US", "ZA"],
    tmdbProviderIds: {
      US: [8],
      ZA: [8]
    },
    tmdbProviderNames: {
      US: ["Netflix", "Netflix Standard with Ads"],
      ZA: ["Netflix", "Netflix Standard with Ads"]
    },
    searchUrlTemplates: {
      web: "https://www.netflix.com/search?q={query}",
      ios: "https://www.netflix.com/search?q={query}",
      android: "https://www.netflix.com/search?q={query}"
    }
  },
  {
    id: "prime",
    name: "Prime Video",
    shortName: "Prime",
    logo: "assets/streamers/prime.png",
    regions: ["US", "ZA"],
    tmdbProviderIds: {
      US: [9],
      ZA: [9]
    },
    tmdbProviderNames: {
      US: ["Amazon Prime Video", "Prime Video", "Amazon Prime Video with Ads"],
      ZA: ["Amazon Prime Video", "Prime Video", "Amazon Prime Video with Ads"]
    },
    searchUrlTemplates: {
      web: "https://www.primevideo.com/search/ref=atv_nb_sr?phrase={query}",
      ios: "https://www.primevideo.com/search/ref=atv_nb_sr?phrase={query}",
      android: "https://www.primevideo.com/search/ref=atv_nb_sr?phrase={query}"
    }
  },
  {
    id: "disney",
    name: "Disney+",
    shortName: "Disney+",
    logo: "assets/streamers/disney.png",
    regions: ["US", "ZA"],
    tmdbProviderIds: {
      US: [337],
      ZA: [337]
    },
    tmdbProviderNames: {
      US: ["Disney Plus", "Disney+"],
      ZA: ["Disney Plus", "Disney+"]
    },
    searchUrlTemplates: {
      web: "https://www.disneyplus.com/search/{query}",
      ios: "https://www.disneyplus.com/search/{query}",
      android: "https://www.disneyplus.com/search/{query}"
    }
  },
  {
    id: "appletv",
    name: "Apple TV+",
    shortName: "Apple TV+",
    logo: "assets/streamers/appletv.png",
    regions: ["US", "ZA"],
    tmdbProviderIds: {
      US: [350],
      ZA: [350]
    },
    tmdbProviderNames: {
      US: ["Apple TV Plus", "Apple TV+"],
      ZA: ["Apple TV Plus", "Apple TV+"]
    },
    searchUrlTemplates: {
      web: "https://tv.apple.com/search?term={query}",
      ios: "https://tv.apple.com/search?term={query}",
      android: "https://tv.apple.com/search?term={query}"
    }
  },
  {
    id: "max",
    name: "Max",
    shortName: "Max",
    logo: "assets/streamers/max.png",
    regions: ["US"],
    tmdbProviderIds: {
      US: [1899, 384]
    },
    tmdbProviderNames: {
      US: ["Max", "Max Amazon Channel", "HBO Max", "HBO Max Amazon Channel"]
    },
    searchUrlTemplates: {
      web: "https://play.max.com/search?q={query}",
      ios: "https://play.max.com/search?q={query}",
      android: "https://play.max.com/search?q={query}"
    },
    notes: "Uses both Max and legacy HBO Max TMDB provider IDs."
  },
  {
    id: "hulu",
    name: "Hulu",
    shortName: "Hulu",
    logo: "assets/streamers/hulu.png",
    regions: ["US"],
    tmdbProviderIds: {
      US: [15]
    },
    tmdbProviderNames: {
      US: ["Hulu", "Hulu (With Ads)", "Hulu Amazon Channel"]
    },
    searchUrlTemplates: {
      web: "https://www.hulu.com/search?q={query}",
      ios: "https://www.hulu.com/search?q={query}",
      android: "https://www.hulu.com/search?q={query}"
    }
  },
  {
    id: "peacock",
    name: "Peacock",
    shortName: "Peacock",
    logo: "assets/streamers/peacock.png",
    regions: ["US"],
    tmdbProviderIds: {
      US: [386]
    },
    tmdbProviderNames: {
      US: ["Peacock", "Peacock Premium", "Peacock Premium Plus", "Peacock Premium with Ads"]
    },
    searchUrlTemplates: {
      web: "https://www.peacocktv.com/search?q={query}",
      ios: "https://www.peacocktv.com/search?q={query}",
      android: "https://www.peacocktv.com/search?q={query}"
    }
  },
  {
    id: "paramount",
    name: "Paramount+",
    shortName: "Paramount+",
    logo: "assets/streamers/paramount.png",
    regions: ["US"],
    tmdbProviderIds: {
      US: [531, 2303, 2304]
    },
    tmdbProviderNames: {
      US: ["Paramount Plus", "Paramount+", "Paramount Plus Premium", "Paramount Plus Basic with Ads", "Paramount+ Amazon Channel"]
    },
    searchUrlTemplates: {
      web: "https://www.paramountplus.com/search/?term={query}",
      ios: "https://www.paramountplus.com/search/?term={query}",
      android: "https://www.paramountplus.com/search/?term={query}"
    }
  },
  {
    id: "showtime",
    name: "Showtime",
    shortName: "Showtime",
    logo: "assets/streamers/showtime.png",
    regions: ["US"],
    tmdbProviderIds: {
      US: [1770]
    },
    tmdbProviderNames: {
      US: ["Paramount+ with Showtime", "Showtime", "Showtime Amazon Channel", "Showtime Roku Premium Channel"]
    },
    searchUrlTemplates: {
      web: "https://www.paramountplus.com/search/?term={query}",
      ios: "https://www.paramountplus.com/search/?term={query}",
      android: "https://www.paramountplus.com/search/?term={query}"
    },
    notes: "TMDB surfaces Showtime inside Paramount+ with Showtime in US watch-provider data."
  },
  {
    id: "starz",
    name: "Starz",
    shortName: "Starz",
    logo: "assets/streamers/starz.png",
    regions: ["US"],
    tmdbProviderIds: {
      US: [43]
    },
    tmdbProviderNames: {
      US: ["Starz", "Starz Amazon Channel", "Starz Roku Premium Channel"]
    },
    searchUrlTemplates: {
      web: "https://www.starz.com/us/en/search?q={query}",
      ios: "https://www.starz.com/us/en/search?q={query}",
      android: "https://www.starz.com/us/en/search?q={query}"
    }
  },
  {
    id: "youtube",
    name: "YouTube",
    shortName: "YouTube",
    logo: "assets/streamers/youtube.png",
    regions: ["US", "ZA"],
    tmdbProviderIds: {
      US: [192],
      ZA: [192]
    },
    tmdbProviderNames: {
      US: ["YouTube", "YouTube Premium"],
      ZA: ["YouTube", "YouTube Premium"]
    },
    searchUrlTemplates: {
      web: "https://www.youtube.com/results?search_query={query}",
      ios: "https://www.youtube.com/results?search_query={query}",
      android: "https://www.youtube.com/results?search_query={query}"
    }
  }
];

// src/lib/deep-link.ts
var REGISTRY = streamers_default;
var REGISTRY_BY_ID = new Map(REGISTRY.map((streamer) => [streamer.id, streamer]));
function buildSearchQuery(title) {
  return title.year ? `${title.title} ${title.year}` : title.title;
}
function buildStreamerSearchUrls(title, streamerId) {
  const streamer = REGISTRY_BY_ID.get(streamerId);
  if (!streamer) {
    return {};
  }
  const query = encodeURIComponent(buildSearchQuery(title));
  const platforms = ["web", "ios", "android"];
  return Object.fromEntries(
    platforms.flatMap((platform) => {
      const template = streamer.searchUrlTemplates[platform] ?? streamer.searchUrlTemplates.web;
      return template ? [[platform, template.replace("{query}", query)]] : [];
    })
  );
}
function pickPlatform() {
  const platform = Capacitor.getPlatform();
  if (platform === "android" || platform === "ios") {
    return platform;
  }
  return "web";
}
function buildDeepLink(show, streamer, platform) {
  const urls = buildStreamerSearchUrls(show, streamer);
  return urls[platform] ?? urls.web;
}
async function fallbackToWeb(show, streamer) {
  const web = buildStreamerSearchUrls(show, streamer).web;
  if (web) {
    await AppLauncher.openUrl({ url: web });
  }
}
async function launchShow(show, streamer) {
  const platform = pickPlatform();
  const link = buildDeepLink(show, streamer, platform);
  if (!link) {
    await fallbackToWeb(show, streamer);
    return;
  }
  const { value: canOpen } = await AppLauncher.canOpenUrl({ url: link });
  if (canOpen) {
    await AppLauncher.openUrl({ url: link });
    return;
  }
  await fallbackToWeb(show, streamer);
}

// src/lib/scheduler.ts
function parseMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
function clampEndToWindow(startTime, windowEnd, runtimeMinutes) {
  const start = parseMinutes(startTime);
  const endCap = parseMinutes(windowEnd);
  const naturalEnd = start + runtimeMinutes;
  const clamped = Math.min(naturalEnd, endCap);
  const hours = Math.floor(clamped / 60) % 24;
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
function buildSchedule(shows, slots) {
  if (!shows.length || !slots.length) {
    return [];
  }
  return slots.slice().sort((left, right) => {
    if (left.dayOfWeek !== right.dayOfWeek) {
      return left.dayOfWeek - right.dayOfWeek;
    }
    return left.band.localeCompare(right.band);
  }).map((slot, index) => {
    const show = shows[index % shows.length];
    const { startTime, endTime } = bandWindow(slot.band);
    return {
      id: `slot-${slot.dayOfWeek}-${startTime}`,
      showId: show.id,
      titleId: show.id,
      providerId: show.providers?.US?.[0] ?? null,
      searchUrls: {},
      dayOfWeek: slot.dayOfWeek,
      startTime,
      endTime: clampEndToWindow(startTime, endTime, show.runtimeMinutes ?? 60),
      enabled: true
    };
  });
}
function scheduleStats(schedule, shows = []) {
  const ids = new Set(
    schedule.map((entry) => entry.titleId ?? entry.showId).filter((value) => Boolean(value))
  );
  const weeklyMinutes = schedule.reduce((total, entry) => {
    const duration = parseMinutes(entry.endTime) - parseMinutes(entry.startTime);
    if (duration > 0) {
      return total + duration;
    }
    const legacyShowId = "showId" in entry ? entry.showId : void 0;
    const fallback = shows.find((show) => show.id === legacyShowId)?.runtimeMinutes ?? 0;
    return total + fallback;
  }, 0);
  return {
    slots: schedule.length,
    enabledSlots: schedule.filter((entry) => entry.enabled).length,
    titlesScheduled: ids.size,
    uniqueShows: ids.size,
    weeklyMinutes
  };
}

// src/lib/live-title-details.ts
var pendingTitleLoads = /* @__PURE__ */ new Set();
function parseTitleId(id) {
  const match = /^tmdb-(movie|tv)-(\d+)$/.exec(id);
  if (!match) return null;
  return {
    tmdbType: match[1],
    tmdbId: Number(match[2])
  };
}
function toShow(source) {
  return {
    id: source.id,
    tmdbId: source.tmdbId,
    tmdbType: source.tmdbType,
    title: source.title,
    originalTitle: "originalTitle" in source ? source.originalTitle : source.title,
    year: source.year,
    originalLanguage: "originalLanguage" in source ? source.originalLanguage : "en",
    overview: "overview" in source ? source.overview : "",
    posterPath: "posterPath" in source ? source.posterPath : null,
    posterUrl: source.posterUrl ?? null,
    backdropPath: "backdropPath" in source ? source.backdropPath : null,
    backdropUrl: source.backdropUrl ?? null,
    releaseDate: "releaseDate" in source ? source.releaseDate : null,
    genreIds: "genreIds" in source ? source.genreIds : [],
    genres: "genres" in source ? source.genres : [],
    popularity: "popularity" in source ? source.popularity : 0,
    voteAverage: "voteAverage" in source ? source.voteAverage : 0,
    voteCount: "voteCount" in source ? source.voteCount : 0,
    providerBadges: "providerBadges" in source ? source.providerBadges : [],
    runtimeMinutes: "runtimeMinutes" in source ? source.runtimeMinutes : null,
    providers: {},
    deepLinks: {}
  };
}
function titleIdsForState(state) {
  const ids = state.shows.length > 0 ? state.shows : state.selectedTitles.map((title) => title.id);
  return [...new Set(ids)];
}
function fetchMissingTitle(id, parsed, redraw) {
  const key = `${parsed.tmdbType}:${parsed.tmdbId}`;
  if (pendingTitleLoads.has(key)) return;
  pendingTitleLoads.add(key);
  void fetchTitle(parsed.tmdbType, parsed.tmdbId).then((response) => {
    if (response.item) {
      setCachedTitleDetail(parsed.tmdbType, parsed.tmdbId, response.item);
    }
  }).catch(() => {
  }).finally(() => {
    pendingTitleLoads.delete(key);
    redraw();
  });
}
function resolveLiveTitles(state, redraw) {
  const persisted = new Map(state.selectedTitles.map((title) => [title.id, title]));
  const titles = [];
  let loading = false;
  for (const id of titleIdsForState(state)) {
    const parsed = parseTitleId(id);
    if (!parsed) continue;
    const cached = getCachedTitleDetail(parsed.tmdbType, parsed.tmdbId);
    if (cached) {
      titles.push(toShow(cached));
      continue;
    }
    const fallback = persisted.get(id);
    if (fallback) {
      titles.push(toShow(fallback));
    }
    loading = true;
    fetchMissingTitle(id, parsed, redraw);
  }
  return { titles, loading };
}

// src/screens/preview.ts
var swapTarget = null;
function slotKey(e2) {
  return `${e2.dayOfWeek}|${e2.startTime}`;
}
function readPicks(ctx) {
  const raw = loadDraftSlotsJson();
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
    }
  }
  return ctx.session.draftSlots;
}
function renderPreview(ctx) {
  const picks = readPicks(ctx);
  const { titles: shows, loading } = resolveLiveTitles(ctx.state, ctx.redraw);
  const base = buildSchedule(shows, picks);
  const schedule = base.map((e2) => {
    const k2 = slotKey(e2);
    const alt = ctx.session.previewEdits[k2];
    return alt ? { ...e2, showId: alt } : e2;
  });
  const stats = scheduleStats(schedule, shows);
  const openSwap = (e2) => {
    swapTarget = e2;
    ctx.redraw();
  };
  const applySwap = async (showId) => {
    if (!swapTarget) return;
    ctx.session.previewEdits[slotKey(swapTarget)] = showId;
    swapTarget = null;
    ctx.redraw();
  };
  const lock = async () => {
    ctx.session.previewEdits = {};
    clearDraftSlots();
    ctx.session.draftSlots = [];
    await ctx.patch({ schedule });
    ctx.navigate("notify");
  };
  const DAY_SHORT3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return b`
    <div class="screen layout">
      <div class="layout__body">
        <h2>Wizard 4/4 — Preview</h2>
        ${loading && !shows.length ? b`<p class="muted">Loading titles…</p>` : null}
        <p class="muted">Slots: ${stats.slots} · Shows used: ${stats.uniqueShows} · Weekly minutes ~ ${stats.weeklyMinutes}</p>
        <div style="display:grid;gap:6px;margin-top:12px;">
          ${schedule.map(
    (e2) => b`
              <button type="button" class="card-select" @click=${() => openSwap(e2)}>
                ${DAY_SHORT3[e2.dayOfWeek]} ${e2.startTime}-${e2.endTime} · ${shows.find((s2) => s2.id === e2.showId)?.title ?? e2.showId}
              </button>
            `
  )}
        </div>
        <mc-modal ?open=${Boolean(swapTarget)} title="Swap show" @mc-close=${() => {
    swapTarget = null;
    ctx.redraw();
  }}>
          <div class="grid-3">
            ${shows.map(
    (s2) => b`
                <mc-poster-card title=${s2.title} image=${s2.posterUrl} @click=${() => applySwap(s2.id)}></mc-poster-card>
              `
  )}
          </div>
        </mc-modal>
      </div>
      <div style="display:grid;gap:8px;">
        <mc-button variant="ghost" label="Not quite" @click=${() => ctx.navigate("wizard/times")}></mc-button>
        <mc-button label="Lock it in" @click=${lock}></mc-button>
      </div>
    </div>
  `;
}

// src/screens/notify.ts
function renderNotify(ctx) {
  const showBanner = ctx.session.notifyDenied || ctx.state.notificationsEnabled === false;
  const allow = async () => {
    const res = await LocalNotifications.requestPermissions();
    const granted = res.display === "granted";
    ctx.session.notifyDenied = !granted;
    await ctx.patch({ notificationsEnabled: granted });
    ctx.navigate("notify");
  };
  const skip = async () => {
    ctx.session.notifyDenied = false;
    await ctx.patch({ notificationsEnabled: false });
    ctx.navigate("scheduling");
  };
  const onward = () => {
    ctx.session.notifyDenied = false;
    ctx.navigate("scheduling");
  };
  return b`
    <div class="screen layout">
      <div class="layout__body" style="text-align:center;">
        <div style="font-size:3rem;">🔔</div>
        <h2>One last thing.</h2>
        <p class="muted">We’ll nudge you when a pick in your lineup starts so you can jump straight in.</p>
        ${showBanner ? b`<div class="banner">Notifications are off. You can enable them later in Settings.</div>` : ""}
      </div>
      <div style="display:grid;gap:8px;">
        <mc-button label="Allow" @click=${allow}></mc-button>
        ${showBanner ? b`<mc-button label="Continue" variant="ghost" @click=${onward}></mc-button>` : ""}
        <button type="button" class="muted" style="background:none;border:none;cursor:pointer;" @click=${skip}>Skip for now</button>
      </div>
    </div>
  `;
}

// src/lib/notifications.ts
function nextOccurrence(dayOfWeek, timeHHmm) {
  const now = /* @__PURE__ */ new Date();
  const [hh, mm] = timeHHmm.split(":").map(Number);
  const target = new Date(now);
  const add = (dayOfWeek - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + add);
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 7);
  return target;
}
function pickStreamerForShow(show, state) {
  const region = state.region;
  const providers = show.providers[region] ?? [];
  for (const s2 of state.streamers) {
    if (providers.includes(s2)) return s2;
  }
  return state.streamers[0];
}
async function scheduleEntriesToNotifications(state, shows, streamers) {
  const names = new Map(streamers.map((s2) => [s2.id, s2.name]));
  const platform = pickPlatform();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n2) => ({ id: n2.id })) });
  }
  const notifications = state.schedule.filter((e2) => e2.enabled).map((entry, idx) => {
    const show = shows.find((s2) => s2.id === entry.showId);
    if (!show) return null;
    const streamer = pickStreamerForShow(show, state);
    if (!streamer) return null;
    const when = nextOccurrence(entry.dayOfWeek, entry.startTime);
    const link = buildDeepLink(show, streamer, platform) ?? "";
    const streamerName = names.get(streamer) ?? streamer;
    return {
      id: 1e3 + idx,
      title: show.title,
      body: `Starts now on ${streamerName} \u2014 Tap to watch.`,
      schedule: { at: when },
      extra: { showId: show.id, streamer, deepLink: link }
    };
  }).filter(Boolean);
  if (notifications.length) {
    await LocalNotifications.schedule({ notifications });
  }
}

// src/screens/scheduling.ts
var activeCtx = null;
var McSchedulingRun = class extends HTMLElement {
  connectedCallback() {
    const ctx = activeCtx;
    if (!ctx) return;
    const { titles: shows, loading } = resolveLiveTitles(ctx.state, ctx.redraw);
    const bar = this.querySelector("mc-progress-bar");
    const label = this.querySelector("[data-label]");
    if (loading && !shows.length) {
      if (label) label.textContent = "Loading titles\u2026";
      return;
    }
    const start = performance.now();
    const finalize = async () => {
      try {
        if (ctx.state.notificationsEnabled) {
          await scheduleEntriesToNotifications(ctx.state, shows, ctx.streamers);
        }
      } catch {
      }
      await ctx.patch({ onboarded: true });
      ctx.navigate("now");
    };
    const step = () => {
      const t2 = Math.min(1, (performance.now() - start) / 2500);
      bar?.setAttribute("value", String(t2));
      if (label) label.textContent = `Scheduling ${ctx.state.shows.length} shows across your week\u2026`;
      if (t2 < 1) requestAnimationFrame(step);
      else void finalize();
    };
    step();
  }
};
if (!customElements.get("mc-scheduling-run")) {
  customElements.define("mc-scheduling-run", McSchedulingRun);
}
function renderScheduling(ctx) {
  activeCtx = ctx;
  return b`
    <div class="screen layout">
      <mc-scheduling-run>
        <div class="layout__body">
          <p data-label>Scheduling ${ctx.state.shows.length} shows across your week…</p>
          <mc-progress-bar value="0"></mc-progress-bar>
        </div>
      </mc-scheduling-run>
    </div>
  `;
}

// src/lib/channel-hero.ts
function parse(t2) {
  const [h2, m2] = t2.split(":").map(Number);
  return h2 * 60 + m2;
}
function atSlotStart(entry, base) {
  const d2 = new Date(base);
  const add = (entry.dayOfWeek - d2.getDay() + 7) % 7;
  d2.setDate(d2.getDate() + add);
  const [h2, m2] = entry.startTime.split(":").map(Number);
  d2.setHours(h2, m2, 0, 0);
  return d2;
}
function atSlotEnd(entry, base) {
  const d2 = atSlotStart(entry, base);
  const [h2, m2] = entry.endTime.split(":").map(Number);
  d2.setHours(h2, m2, 0, 0);
  if (d2 < atSlotStart(entry, base)) d2.setDate(d2.getDate() + 1);
  return d2;
}
function nextOccurrenceStart(entry, from) {
  let d2 = atSlotStart(entry, from);
  if (d2 <= from) {
    d2 = new Date(d2);
    d2.setDate(d2.getDate() + 7);
  }
  return d2;
}
function computeHero(schedule, shows, now = /* @__PURE__ */ new Date()) {
  const enabled = schedule.filter((s2) => s2.enabled);
  for (const e2 of enabled) {
    const start = atSlotStart(e2, now);
    const end = atSlotEnd(e2, now);
    if (now >= start && now <= end) {
      const show = shows.find((x2) => x2.id === e2.showId);
      if (show) return { kind: "NOW", entry: e2, show };
    }
  }
  const upcoming = enabled.map((e2) => ({ e: e2, t: nextOccurrenceStart(e2, now) })).sort((a2, b2) => a2.t.getTime() - b2.t.getTime());
  const next = upcoming[0]?.e;
  if (next) {
    const show = shows.find((x2) => x2.id === next.showId);
    if (show) return { kind: "UP_NEXT", entry: next, show };
  }
  return { kind: "EMPTY" };
}
function nextStrip(schedule, shows, count, now = /* @__PURE__ */ new Date()) {
  const enabled = schedule.filter((s2) => s2.enabled);
  const ordered = enabled.map((e2) => ({ e: e2, t: nextOccurrenceStart(e2, now) })).sort((a2, b2) => a2.t.getTime() - b2.t.getTime());
  const hero = computeHero(schedule, shows, now);
  const out = [];
  for (const x2 of ordered) {
    const show = shows.find((s2) => s2.id === x2.e.showId);
    if (!show) continue;
    const skipHero = hero.kind !== "EMPTY" && hero.entry.dayOfWeek === x2.e.dayOfWeek && hero.entry.startTime === x2.e.startTime && hero.entry.showId === x2.e.showId;
    if (skipHero) continue;
    out.push({ entry: x2.e, show });
    if (out.length >= count) break;
  }
  return out;
}
function todayLineup(schedule, shows, now = /* @__PURE__ */ new Date()) {
  const dow = now.getDay();
  return schedule.filter((s2) => s2.enabled && s2.dayOfWeek === dow).sort((a2, b2) => parse(a2.startTime) - parse(b2.startTime)).map((entry) => {
    const show = shows.find((x2) => x2.id === entry.showId);
    return show ? { entry, show } : null;
  }).filter(Boolean);
}

// src/ui/tabs.ts
function renderTabs(active, ctx) {
  return b`
    <nav class="bottom-tabs">
      <button type="button" aria-current=${active === "now" ? "true" : "false"} @click=${() => ctx.navigate("now")}>Now</button>
      <button type="button" aria-current=${active === "week" ? "true" : "false"} @click=${() => ctx.navigate("week")}>Week</button>
      <button type="button" aria-current=${active === "shows" ? "true" : "false"} @click=${() => ctx.navigate("shows-picks")}>Shows</button>
    </nav>
  `;
}

// src/screens/channel.ts
function pickStreamer(show, region, picks) {
  const prov = show.providers[region] ?? [];
  for (const p2 of picks) {
    if (prov.includes(p2)) return p2;
  }
  return picks[0];
}
function renderChannel(ctx) {
  const shows = ctx.catalogue.filter((s2) => ctx.state.shows.includes(s2.id));
  const hero = computeHero(ctx.state.schedule, shows);
  const strip = nextStrip(ctx.state.schedule, shows, 4);
  const lineup = todayLineup(ctx.state.schedule, shows);
  const tag = hero.kind === "NOW" ? "NOW" : hero.kind === "UP_NEXT" ? "UP NEXT" : "Today";
  const streamer = hero.kind === "EMPTY" ? void 0 : pickStreamer(hero.show, ctx.state.region, ctx.state.streamers);
  const streamerName = streamer ? ctx.streamers.find((s2) => s2.id === streamer)?.name ?? streamer : "";
  const watch = async () => {
    if (hero.kind === "EMPTY" || !streamer) return;
    await launchShow(hero.show, streamer);
  };
  return b`
    <div class="layout screen" style="padding:0;">
      <mc-top-bar title="MyChannel" show-settings @mc-settings=${() => ctx.navigate("settings")}></mc-top-bar>
      <div class="layout__body" style="padding:16px;">
        <div class="hero">
          ${hero.kind === "EMPTY" ? b`<div class="hero__meta"><div class="muted">Nothing scheduled today yet.</div></div>` : b`
                <img class="hero__backdrop" src=${hero.show.backdropUrl} alt="" />
                <div class="hero__meta">
                  <div class="muted">${tag}</div>
                  <h2 style="margin:6px 0;">${hero.show.title}</h2>
                  <mc-button label=${streamer ? `Watch on ${streamerName} \u2192` : "Watch"} @click=${watch}></mc-button>
                </div>
              `}
        </div>
        <h3 style="margin:16px 0 8px;">Up Next</h3>
        <div class="strip">
          ${strip.map(
    ({ show }) => b`
              <mc-poster-card title=${show.title} image=${show.posterUrl}></mc-poster-card>
            `
  )}
        </div>
        <h3 style="margin:16px 0 8px;">Today's Lineup</h3>
        <div class="lineup">
          ${lineup.length ? lineup.map(
    ({ entry, show }) => b`
                  <div class="lineup__row">
                    <div>${entry.startTime}</div>
                    <div>${show.title}</div>
                  </div>
                `
  ) : b`<div class="muted">No slots today.</div>`}
        </div>
      </div>
      ${renderTabs("now", ctx)}
    </div>
  `;
}

// src/screens/week.ts
var DAY_SHORT2 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function inferBand(start) {
  const h2 = Number(start.split(":")[0]);
  if (h2 >= 22) return "late";
  if (h2 >= 17) return "evening";
  if (h2 >= 12) return "afternoon";
  return "early";
}
function scheduleToSlots(schedule) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const e2 of schedule) {
    const band = inferBand(e2.startTime);
    const k2 = `${e2.dayOfWeek}|${band}`;
    if (seen.has(k2)) continue;
    seen.add(k2);
    out.push({ dayOfWeek: e2.dayOfWeek, band });
  }
  return out;
}
function renderWeek(ctx) {
  const bands = ["early", "afternoon", "evening", "late"];
  const slots = scheduleToSlots(ctx.state.schedule);
  const has = (d2, b2) => slots.some((s2) => s2.dayOfWeek === d2 && s2.band === b2);
  const click = async (d2, b2) => {
    const nextSlots = toggleSlot(slots, d2, b2);
    const shows = ctx.catalogue.filter((s2) => ctx.state.shows.includes(s2.id));
    const schedule = buildSchedule(shows, nextSlots);
    await ctx.patch({ schedule });
    ctx.navigate("week");
  };
  return b`
    <div class="layout screen" style="padding:0;">
      <mc-top-bar title="Week" show-back @mc-back=${() => ctx.navigate("now")}></mc-top-bar>
      <div class="layout__body" style="padding:16px;">
        <p class="muted">Tap a slot to toggle. We’ll reshuffle picks across enabled slots.</p>
        <div style="display:grid;grid-template-columns:64px repeat(7,minmax(0,1fr));gap:4px;align-items:center;">
          <div></div>
          ${UI_DAY_ORDER.map((d2) => b`<div class="muted" style="text-align:center;font-size:0.75rem;">${DAY_SHORT2[d2]}</div>`)}
          ${bands.map(
    (b2) => b`
              <div class="muted" style="font-size:0.75rem;">${BAND_LABEL[b2]}</div>
              ${UI_DAY_ORDER.map(
      (d2) => b`
                  <button
                    type="button"
                    class="card-select"
                    style="padding:8px 4px;font-size:0.7rem;"
                    aria-pressed=${has(d2, b2)}
                    @click=${() => click(d2, b2)}
                  >
                    ${has(d2, b2) ? "\u25CF" : "\u25CB"}
                  </button>
                `
    )}
            `
  )}
        </div>
      </div>
      ${renderTabs("week", ctx)}
    </div>
  `;
}

// src/screens/shows-tab.ts
function renderShowsTab(ctx) {
  const { titles: shows, loading } = resolveLiveTitles(ctx.state, ctx.redraw);
  const remove = async (id) => {
    await ctx.patch({
      shows: ctx.state.shows.filter((x2) => x2 !== id),
      selectedTitles: ctx.state.selectedTitles.filter((title) => title.id !== id)
    });
    ctx.navigate("shows-picks");
  };
  return b`
    <div class="layout screen" style="padding:0;">
      <mc-top-bar title="Your shows" show-back @mc-back=${() => ctx.navigate("now")}></mc-top-bar>
      <div class="layout__body" style="padding:16px;">
        <mc-button label="Add shows" @click=${() => ctx.navigate("shows-picker")}></mc-button>
        ${loading && !shows.length ? b`<p class="muted">Loading titles…</p>` : null}
        <div class="grid-3" style="margin-top:12px;">
          ${shows.map(
    (s2) => b`
              <div>
                <mc-poster-card title=${s2.title} image=${s2.posterUrl}></mc-poster-card>
                <mc-button variant="danger" label="Remove" @click=${() => remove(s2.id)}></mc-button>
              </div>
            `
  )}
        </div>
      </div>
      ${renderTabs("shows", ctx)}
    </div>
  `;
}

// node_modules/@capacitor/preferences/dist/esm/index.js
init_dist();
var Preferences = registerPlugin("Preferences", {
  web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m2) => new m2.PreferencesWeb())
});

// src/state/store.ts
var KEY = "mychannel_user_state_v2";
function scheduleId(dayOfWeek, startTime) {
  return `slot-${dayOfWeek}-${startTime}`;
}
function normalizeSchedule(schedule) {
  return (schedule ?? []).map((entry) => ({
    id: scheduleId(entry.dayOfWeek, entry.startTime),
    showId: entry.showId,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    enabled: entry.enabled
  }));
}
function defaultState() {
  return {
    version: 2,
    onboarded: false,
    region: "US",
    subscription: { tier: "free" },
    streamers: [],
    shows: [],
    selectedTitles: [],
    schedule: [],
    channel: [],
    lastOpenedAt: (/* @__PURE__ */ new Date()).toISOString(),
    notificationsEnabled: true
  };
}
function migrateState(input) {
  const base = defaultState();
  if (!input || typeof input !== "object") {
    return base;
  }
  const legacy = input;
  if (legacy.version === 2) {
    return {
      ...base,
      ...legacy,
      schedule: normalizeSchedule(legacy.schedule),
      selectedTitles: Array.isArray(legacy.selectedTitles) ? legacy.selectedTitles ?? [] : [],
      channel: Array.isArray(legacy.channel) ? legacy.channel ?? [] : [],
      lastOpenedAt: legacy.lastOpenedAt ?? base.lastOpenedAt
    };
  }
  return {
    ...base,
    onboarded: legacy.onboarded ?? base.onboarded,
    region: legacy.region ?? base.region,
    subscription: legacy.subscription ?? base.subscription,
    streamers: Array.isArray(legacy.streamers) ? legacy.streamers : [],
    shows: Array.isArray(legacy.shows) ? legacy.shows : [],
    schedule: normalizeSchedule(legacy.schedule),
    lastOpenedAt: legacy.lastOpenedAt ?? base.lastOpenedAt,
    notificationsEnabled: legacy.notificationsEnabled ?? base.notificationsEnabled
  };
}
function isNative() {
  try {
    return Boolean(
      window.Capacitor?.isNativePlatform?.()
    );
  } catch {
    return false;
  }
}
async function loadState() {
  let raw = null;
  if (isNative()) {
    raw = (await Preferences.get({ key: KEY })).value;
  } else if (typeof localStorage !== "undefined") {
    raw = localStorage.getItem(KEY);
  }
  if (!raw) {
    return null;
  }
  try {
    return migrateState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}
async function saveState(state) {
  const payload = JSON.stringify({
    ...state,
    lastOpenedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (isNative()) {
    await Preferences.set({ key: KEY, value: payload });
    return;
  }
  localStorage.setItem(KEY, payload);
}
async function clearState() {
  if (isNative()) {
    await Preferences.remove({ key: KEY });
    return;
  }
  localStorage.removeItem(KEY);
}

// src/screens/settings.ts
function renderSettings(ctx) {
  const toggleNotifications = async () => {
    const enabled = ctx.state.notificationsEnabled !== false;
    const next = !enabled;
    if (next) await LocalNotifications.requestPermissions();
    await ctx.patch({ notificationsEnabled: next });
    ctx.navigate("settings");
  };
  const reset = async () => {
    await clearState();
    Object.assign(ctx.state, defaultState());
    ctx.session.draftSlots = [];
    clearDraftSlots();
    ctx.session.previewEdits = {};
    ctx.session.notifyDenied = false;
    await saveState(ctx.state);
    ctx.navigate("splash");
  };
  return b`
    <div class="screen layout">
      <mc-top-bar title="Settings" show-back @mc-back=${() => ctx.navigate("now")}></mc-top-bar>
      <div class="layout__body" style="display:grid;gap:12px;">
        <div class="lineup__row">
          <div>Region</div>
          <div>${ctx.state.region}</div>
        </div>
        <div class="lineup__row">
          <div>Notifications</div>
          <button type="button" class="card-select" @click=${toggleNotifications}>
            ${ctx.state.notificationsEnabled !== false ? "On" : "Off"}
          </button>
        </div>
        <mc-button variant="danger" label="Reset my channel" @click=${reset}></mc-button>
        <mc-button variant="ghost" label="About" @click=${() => ctx.navigate("about")}></mc-button>
      </div>
    </div>
  `;
}

// src/screens/about.ts
function renderAbout(ctx) {
  return b`
    <div class="screen layout">
      <mc-top-bar title="About" show-back @mc-back=${() => ctx.navigate("settings")}></mc-top-bar>
      <div class="layout__body">
        <p>MyChannel v1 — personal lineup across your streamers.</p>
        <p class="muted">
          <a href="https://example.com/privacy" target="_blank" rel="noreferrer">Privacy policy</a>
        </p>
      </div>
    </div>
  `;
}

// src/screens/slot-edit.ts
var McSlotEditScreen = class extends HTMLElement {
  static observedAttributes = ["slot-id"];
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const slotId = this.getAttribute("slot-id") ?? "";
    this.innerHTML = `<h1>Slot edit: ${slotId}</h1>`;
  }
};
if (!customElements.get("mc-slot-edit-screen")) {
  customElements.define("mc-slot-edit-screen", McSlotEditScreen);
}
function renderSlotEdit(ctx, slotId) {
  return b`
    <div class="screen layout">
      <mc-top-bar title="Edit slot" show-back @mc-back=${() => ctx.navigate("/channel")}></mc-top-bar>
      <div class="layout__body">
        <mc-slot-edit-screen slot-id=${slotId}></mc-slot-edit-screen>
        <mc-button label="Close" @click=${() => ctx.navigate("/channel")}></mc-button>
      </div>
    </div>
  `;
}

// src/router.ts
function normalizeHash() {
  const h2 = window.location.hash.replace(/^#\/?/, "");
  return h2 || "splash";
}
function navigate(hash) {
  window.location.hash = `#/${hash.replace(/^\/+/, "")}`;
}
function mountRouter(ctx, outlet2) {
  const draw = () => {
    const route = normalizeHash();
    let view;
    if (route.startsWith("slot-edit/")) {
      const slotId = decodeURIComponent(route.slice("slot-edit/".length));
      view = renderSlotEdit(ctx, slotId);
      D(view, outlet2);
      return;
    }
    switch (route) {
      case "splash":
        view = renderSplash(ctx);
        break;
      case "welcome":
        view = renderWelcome(ctx);
        break;
      case "region":
        view = renderRegion(ctx);
        break;
      case "wizard/streamers":
        view = renderStreamers(ctx);
        break;
      case "wizard/shows":
      case "shows-picker":
        view = renderShows(ctx, route === "shows-picker");
        break;
      case "wizard/times":
        view = renderTimes(ctx);
        break;
      case "wizard/preview":
        view = renderPreview(ctx);
        break;
      case "notify":
        view = renderNotify(ctx);
        break;
      case "scheduling":
        view = renderScheduling(ctx);
        break;
      case "now":
      case "channel":
        view = renderChannel(ctx);
        break;
      case "week":
        view = renderWeek(ctx);
        break;
      case "shows-picks":
        view = renderShowsTab(ctx);
        break;
      case "settings":
        view = renderSettings(ctx);
        break;
      case "about":
        view = renderAbout(ctx);
        break;
      default:
        view = renderSplash(ctx);
    }
    D(view, outlet2);
  };
  window.addEventListener("hashchange", draw);
  draw();
  return draw;
}

// src/main.ts
var componentsIndexModule = "./components/index";
void import(componentsIndexModule).catch(() => void 0);
var outlet = () => document.getElementById("app");
async function loadRuntimeStreamers(region) {
  const cached = getCachedProviders(region);
  if (cached) return cached;
  const response = await fetchProviders(region);
  setCachedProviders(region, response.providers);
  return response.providers;
}
async function bootstrap() {
  const stored = await loadState();
  const state = stored ?? defaultState();
  const streamers = await loadRuntimeStreamers(state.region).catch(() => []);
  let draftSlots = [];
  const rawDraft = loadDraftSlotsJson();
  if (rawDraft) {
    try {
      draftSlots = JSON.parse(rawDraft);
    } catch {
      draftSlots = [];
    }
  }
  const session = { draftSlots, previewEdits: {}, notifyDenied: false };
  let invalidate = () => {
  };
  const patch = async (partial) => {
    Object.assign(state, partial);
    await saveState(state);
    invalidate();
  };
  const ctx = {
    state,
    patch,
    navigate,
    redraw: () => invalidate(),
    catalogue: [],
    streamers,
    session
  };
  void LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
    const extra = action.notification.extra;
    const url = extra?.deepLink;
    if (url) void AppLauncher.openUrl({ url });
  });
  invalidate = mountRouter(ctx, outlet());
  if (state.onboarded) {
    const r2 = window.location.hash.replace(/^#\/?/, "") || "splash";
    const wizard = ["splash", "welcome", "region", "wizard/streamers", "wizard/shows", "wizard/times", "wizard/preview", "notify", "scheduling"].includes(r2);
    if (wizard) navigate("now");
  } else {
    const r2 = window.location.hash.replace(/^#\/?/, "");
    if (r2 === "now" || r2 === "week" || r2 === "shows-picks" || r2 === "settings" || r2 === "about") navigate("splash");
  }
}
void bootstrap();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=main.js.map
