(function () {
  'use strict';

  function parseGitHubUrl(urlString) {
    var url = new URL(urlString);
    if (url.hostname !== 'github.com') return null;

    var parts = url.pathname.split('/').filter(Boolean);
    var owner = parts[0];
    var repo = parts[1];

    if (!owner || !repo) return null;

    var blobIndex = parts.indexOf('blob');
    if (blobIndex >= 0) {
      var branch = parts[blobIndex + 1];
      var filePath = parts.slice(blobIndex + 2).join('/');
      return { type: 'blob', owner: owner, repo: repo, branch: branch, path: filePath };
    }

    return { type: 'repo', owner: owner, repo: repo, branch: null, path: null };
  }

  function isMarkdownPath(path) {
    return /\.(md|markdown)$/i.test(path || '');
  }

  function getRawUrlFromDom() {
    var selectors = ['a[data-testid="raw-button"]', 'a[href*="/raw/"]'];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.href) return el.href;
    }
    return null;
  }

  function convertBlobUrlToRawUrl(parsed) {
    if (!parsed || parsed.type !== 'blob') return null;
    if (!isMarkdownPath(parsed.path)) return null;
    return 'https://raw.githubusercontent.com/' + parsed.owner + '/' + parsed.repo + '/' + parsed.branch + '/' + parsed.path;
  }

  function normalizeRawUrl(rawUrl, parsed) {
    if (!rawUrl) return null;

    try {
      var url = new URL(rawUrl);
      if (url.hostname === 'raw.githubusercontent.com') return url.href;
      if (url.hostname !== 'github.com') return rawUrl;

      var parts = url.pathname.split('/').filter(Boolean);
      var owner = parts[0];
      var repo = parts[1];
      var rawIndex = parts.indexOf('raw');
      if (!owner || !repo || rawIndex < 0) return rawUrl;

      var rawParts = parts.slice(rawIndex + 1);
      var branch = null;
      var filePath = null;

      if (rawParts[0] === 'refs' && rawParts[1] === 'heads') {
        branch = rawParts[2];
        filePath = rawParts.slice(3).join('/');
      } else {
        branch = rawParts[0];
        filePath = rawParts.slice(1).join('/');
      }

      if (!branch && parsed && parsed.branch) branch = parsed.branch;
      if (!filePath && parsed && parsed.path) filePath = parsed.path;
      if (!branch || !filePath) return rawUrl;

      return 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/' + filePath;
    } catch (e) {
      return rawUrl;
    }
  }

  function getReadmeApiUrl(parsed) {
    if (!parsed || parsed.type !== 'repo') return null;
    return 'https://api.github.com/repos/' + parsed.owner + '/' + parsed.repo + '/readme';
  }

  function getContentsApiUrl(parsed) {
    if (!parsed || parsed.type !== 'blob') return null;
    if (!isMarkdownPath(parsed.path)) return null;

    var encodedPath = parsed.path.split('/').map(encodeURIComponent).join('/');
    return 'https://api.github.com/repos/' + parsed.owner + '/' + parsed.repo + '/contents/' + encodedPath + '?ref=' + encodeURIComponent(parsed.branch);
  }

  function decodeGitHubBase64(content) {
    var cleaned = content.replace(/\n/g, '');
    var binary = atob(cleaned);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  function withRawMeta(meta, rawUrl) {
    var nextMeta = Object.assign({}, meta);
    nextMeta.rawUrl = rawUrl || null;
    nextMeta.rawBaseUrl = getRawBaseUrl(rawUrl);
    return nextMeta;
  }

  function getRawBaseUrl(rawUrl) {
    if (!rawUrl) return null;

    try {
      return new URL('.', rawUrl).href;
    } catch (e) {
      return null;
    }
  }

  function fetchText(url, timeoutMs) {
    timeoutMs = timeoutMs || 8000;
    return fetchWithTimeout(url, timeoutMs);
  }

  function fetchWithTimeout(url, timeoutMs) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

    return fetch(url, { signal: controller.signal })
      .then(function (res) {
        clearTimeout(timer);
        if (res.status === 403) return { ok: false, reason: 'private_or_rate_limited', status: 403 };
        if (res.status === 404) return { ok: false, reason: 'not_found', status: 404 };
        if (!res.ok) return { ok: false, reason: 'http_error', status: res.status };
        return res.text().then(function (text) {
          return { ok: true, text: text };
        });
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') return { ok: false, reason: 'timeout' };
        return { ok: false, reason: 'network' };
      });
  }

  function fetchGitHubApiContent(apiUrl, timeoutMs) {
    timeoutMs = timeoutMs || 8000;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

    return fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/vnd.github+json' }
    })
      .then(function (res) {
        clearTimeout(timer);
        if (res.status === 403) return { ok: false, reason: 'private_or_rate_limited', status: 403 };
        if (res.status === 404) return { ok: false, reason: 'not_found', status: 404 };
        if (!res.ok) return { ok: false, reason: 'http_error', status: res.status };
        return res.json().then(function (json) {
          if (!json.content) return { ok: false, reason: 'empty' };
          return {
            ok: true,
            markdown: decodeGitHubBase64(json.content),
            rawUrl: json.download_url || null,
            path: json.path || null
          };
        });
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') return { ok: false, reason: 'timeout' };
        return { ok: false, reason: 'network' };
      });
  }

  function fetchMarkdownForCurrentPage() {
    var parsed = parseGitHubUrl(location.href);
    if (!parsed) {
      return Promise.resolve({
        ok: false,
        reason: 'unknown',
        message: ''
      });
    }

    var meta = {
      owner: parsed.owner,
      repo: parsed.repo,
      branch: parsed.branch,
      path: parsed.path,
      sourceType: parsed.type
    };

    // Layer 1: DOM Raw button
    var rawUrl = getRawUrlFromDom();
    if (rawUrl) {
      var normalizedRawUrl = normalizeRawUrl(rawUrl, parsed);
      return fetchText(normalizedRawUrl).then(function (result) {
        if (result.ok) {
          return { ok: true, markdown: result.text, rawUrl: normalizedRawUrl, meta: withRawMeta(meta, normalizedRawUrl) };
        }
        return tryLayer2();
      });
    }

    return tryLayer2();

    function tryLayer2() {
      // Layer 2: blob -> raw
      var converted = convertBlobUrlToRawUrl(parsed);
      if (converted) {
        return fetchText(converted).then(function (result) {
          if (result.ok) {
            return { ok: true, markdown: result.text, rawUrl: converted, meta: withRawMeta(meta, converted) };
          }
          return tryLayer3();
        });
      }
      return tryLayer3();
    }

    function tryLayer3() {
      // Layer 3: README API
      var readmeApi = getReadmeApiUrl(parsed);
      if (readmeApi) {
        return fetchGitHubApiContent(readmeApi).then(function (result) {
          if (result.ok) {
            meta.path = result.path || meta.path;
            return {
              ok: true,
              markdown: result.markdown,
              rawUrl: result.rawUrl || normalizeRawUrl(rawUrl, parsed),
              meta: withRawMeta(meta, result.rawUrl || normalizeRawUrl(rawUrl, parsed))
            };
          }
          return tryLayer4();
        });
      }
      return tryLayer4();
    }

    function tryLayer4() {
      // Layer 4: Contents API
      var contentsApi = getContentsApiUrl(parsed);
      if (contentsApi) {
        return fetchGitHubApiContent(contentsApi).then(function (result) {
          if (result.ok) {
            meta.path = result.path || meta.path;
            return {
              ok: true,
              markdown: result.markdown,
              rawUrl: result.rawUrl,
              meta: withRawMeta(meta, result.rawUrl)
            };
          }
          return failResult(result.reason || 'not_found');
        });
      }
      return Promise.resolve(failResult('not_found'));
    }

    function failResult(reason) {
      return {
        ok: false,
        reason: reason,
        message: ''
      };
    }
  }

  window.mdReaderFetch = {
    parseGitHubUrl: parseGitHubUrl,
    fetchMarkdownForCurrentPage: fetchMarkdownForCurrentPage
  };
})();
