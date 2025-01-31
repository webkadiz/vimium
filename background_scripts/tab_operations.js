//
// Methods for opening URLs in tabs.
//
// TODO(philc): Convert these to Promise-based APIs.

// Opens the url in the current tab.
function openUrlInCurrentTab(request) {
  if (Utils.hasJavascriptPrefix(request.url)) {
    const tabId = request.tabId;
    const frameId = request.frameId;
    chrome.tabs.sendMessage(tabId, { frameId, handler: "executeUserScript", script: request.url });
  } else {
    chrome.tabs.update(request.tabId, { url: Utils.convertToUrl(request.url) });
  }
}

// Opens request.url in new tab and switches to it.
function openUrlInNewTab(request, callback) {
  if (callback == null) {
    callback = function () {};
  }
  const tabConfig = {
    url: Utils.convertToUrl(request.url),
    active: true,
    windowId: request.tab.windowId,
  };

  const position = request.position;

  let tabIndex = null;

  switch (position) {
    case "start":
      tabIndex = 0;
      break;
    case "before":
      tabIndex = request.tab.index;
      break;
    // if on Chrome or on Firefox but without openerTabId, `tabs.create` opens a tab at the end.
    // but on Firefox and with openerTabId, it opens a new tab next to the opener tab
    case "end":
      tabIndex = BgUtils.isFirefox() ? 9999 : null;
      break;
    // "after" is the default case when there are no options.
    default:
      tabIndex = request.tab.index + 1;
  }
  tabConfig.index = tabIndex;

  if (request.active != null) {
    tabConfig.active = request.active;
  }
  // Firefox does not support "about:newtab" in chrome.tabs.create.
  if (tabConfig["url"] === Utils.chromeNewTabUrl) {
    delete tabConfig["url"];
  }

  tabConfig.openerTabId = request.tab.id;

  // clean position and active, so following `openUrlInNewTab(request)` will create a tab just next to this new tab
  return chrome.tabs.create(
    tabConfig,
    (tab) => callback(Object.assign(request, { tab, tabId: tab.id, position: "", active: false })),
  );
}

// Opens request.url in new window and switches to it.
function openUrlInNewWindow(request, callback) {
  if (callback == null) {
    callback = function () {};
  }
  const winConfig = {
    url: Utils.convertToUrl(request.url),
    active: true,
  };
  if (request.active != null) {
    winConfig.active = request.active;
  }
  // Firefox does not support "about:newtab" in chrome.tabs.create.
  if (tabConfig["url"] === Utils.chromeNewTabUrl) {
    delete winConfig["url"];
  }
  return chrome.windows.create(winConfig, callback);
}

export { openUrlInCurrentTab, openUrlInNewTab, openUrlInNewWindow };
