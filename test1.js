// ==UserScript==
// @name         Topwar Injector (BASE aware)
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  加载 https://felixzone.com.cn/kd/topwar.js，并把基地址变量传参 & 暴露到页面环境
// @match        *://*/*
// @run-at       document-start
// @inject-into  page
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      felixzone.com.cn
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  // ★★★ 关键：基地址变量（尾部保持 /）★★★
  const BASE_URL = "https://felixzone.com.cn/kd/";

  // 供远程脚本可能的异步使用：先把它公开到页面全局
  try {
    // 注入一段小脚本，确保在页面上下文里挂载 window.FZ_BASE
    const seed = document.createElement("script");
    seed.textContent = `window.FZ_BASE=${JSON.stringify(BASE_URL)};`;
    (document.head || document.documentElement).appendChild(seed);
    seed.remove();
  } catch {}

  // 防缓存
  function withBust(url) {
    const u = new URL(url);
    u.searchParams.set("_", Date.now().toString());
    return u.toString();
  }

  // 优先 GM_xmlhttpRequest（不受 CORS），失败回退 fetch
  function fetchText(url) {
    return new Promise((resolve) => {
      if (typeof GM_xmlhttpRequest === "function") {
        GM_xmlhttpRequest({
          method: "GET",
          url: withBust(url),
          headers: { "Cache-Control": "no-store" },
          onload: (res) => resolve(res.responseText || ""),
          onerror: () => resolve(""),
          ontimeout: () => resolve(""),
        });
      } else {
        fetch(withBust(url), { cache: "no-store" })
          .then((r) => r.text())
          .then((t) => resolve(t || ""))
          .catch(() => resolve(""));
      }
    });
  }

  // 把代码以“传参”的方式在页面环境执行
  // 等价于：new Function(code)(BASE_URL)
  function runWithArgInPage(code, arg) {
    try {
      const s = document.createElement("script");
      // 通过 IIFE 包裹并显式把 BASE_URL 当实参传给远端代码
      s.textContent =
        "(function(SITE){\n" +
        code +
        "\n})(window.FZ_BASE || " +
        JSON.stringify(arg) +
        ");\n//# sourceURL=topwar_injected.js";
      (document.head || document.documentElement).appendChild(s);
      s.remove();
      return true;
    } catch {
      return false;
    }
  }

  // 多重回退执行策略（都保持“传参”语义）
  function execute(code, base) {
    // 1) 首选：页面上下文 + 传参
    if (runWithArgInPage(code, base)) return;

    // 2) 尝试 unsafeWindow.Function(code)(base)
    try {
      if (typeof unsafeWindow !== "undefined" && typeof unsafeWindow.Function === "function") {
        unsafeWindow.Function(code)(base);
        return;
      }
    } catch {}

    // 3) 最后：沙箱中执行 new Function(code)(base)
    try {
      new Function(code)(base);
    } catch (e) {
      console.error("[Topwar Injector] 执行失败：", e);
    }
  }

  async function main() {
    try {
      const jsUrl = new URL("topwar.js", BASE_URL).toString(); // 安全拼接
      const script = await fetchText(jsUrl);
      if (script && script.trim()) {
        execute(script, BASE_URL);
      } else {
        console.warn("[Topwar Injector] 拉取到的脚本为空：", jsUrl);
      }
    } catch (e) {
      console.error("[Topwar Injector] 运行异常：", e);
    }
  }

  main();
})();
