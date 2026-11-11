import { expect } from '@playwright/test';

export const contextSnapshot = { solicitudId: '81', captureSessionId: 'a1234567-1234-4123-8123-123456789abc', baseRevision: 'a'.repeat(64), canCapture: true, estado_onboarding: 'CELULAR_VALIDADO', dniReceivedForSession: false, receivedUploadId: null, receiptKind: 'none' };

export async function installSyntheticCapture(page, { phone, width = 1600, height = 1200 } = {}) {
  const state = { context: { ...contextSnapshot }, error: null, contextError: null, contextGets: 0, uploads: 0, blocked: [], delay: 0 };
  // Routes are installed BEFORE navigation. No provider request can leave the browser.
  await page.context().route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'blob:' && new URL(url.pathname).origin === 'http://127.0.0.1:4179') return route.continue();
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      state.blocked.push(url.hostname);
      const resource = route.request().resourceType();
      if (resource === 'script' || resource === 'stylesheet') {
        return route.fulfill({ status: 200, contentType: resource === 'script' ? 'application/javascript' : 'text/css', body: '' });
      }
      return route.abort('blockedbyclient');
    }
    if (url.pathname.includes('/api/')) {
      if (url.pathname.includes('dni-contexto')) {
        state.contextGets++;
        const failure = state.contextError;
        return route.fulfill({ status: failure?.status ?? 200, json: failure?.body ?? { success: true, data: state.context } });
      }
      if (url.pathname.includes('subir-dni')) {
        state.uploads++;
        if (state.delay) await new Promise(resolve => setTimeout(resolve, state.delay));
        if (state.error === 'network') return route.abort('failed');
        if (state.error?.html) return route.fulfill({ status: 502, contentType: 'text/html', body: '<h1>PRIVATE-UPSTREAM-MARKER</h1>' });
        if (state.error) return route.fulfill({ status: state.error.httpStatus ?? state.error.status, json: { success: false, status: state.error.status, cause: state.error.cause, message: 'PRIVATE-UPSTREAM-MARKER', data: { category: state.error.status === 422 ? 'capture' : 'technical', side: state.error.side ?? null, retryable: [429, 502, 503].includes(state.error.status) } } });
        const uploadId = /name="uploadId"\r\n\r\n([^\r]+)/.exec(route.request().postData() ?? '')?.[1];
        return route.fulfill({ status: 200, json: { success: true, data: { ...state.context, uploadId, dniReceivedForSession: true, estado_onboarding: 'DNI_SUBIDO', documentValidation: 'not_performed' } } });
      }
      return route.fulfill({ status: 200, json: { success: true, data: { estado_onboarding: 'CELULAR_VALIDADO' } } });
    }
    return route.continue();
  });
  await page.addInitScript(({ phone, width, height }) => {
    Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { mobile: phone } });
    window.__dni = { calls: 0, stopped: 0, uploads: [], error: null, late: false, noFrame: false, nullBlob: false, continuationFailure: false, continued: 0 };
    const fixture = document.createElement('canvas'); fixture.width = width; fixture.height = height;
    const ctx = fixture.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, width, height);
    const size = Math.min(width, height) * .12;
    for (const [color, x, y] of [['#dc1e1e', 0, 0], ['#1ea032', width-size, 0], ['#1e3cdc', 0, height-size], ['#e6be14', width-size, height-size]]) { ctx.fillStyle = color; ctx.fillRect(x, y, size, size); }
    ctx.fillStyle = 'black'; ctx.font = `${Math.round(width / 20)}px monospace`; ctx.fillText('PRUEBA SIN VALIDEZ', width*.15, height*.3); ctx.fillText('ABC0123456789', width*.15, height*.45);
    for (let y=height*.55; y<height*.8; y+=8) ctx.fillRect(width*.15, y, width*.65, 2);
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(source, ...args) { return draw.call(this, source instanceof HTMLVideoElement ? fixture : source, ...args); };
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) { if (window.__dni.nullBlob) return callback(null); return toBlob.call(this, callback, ...args); };
    for (const [property, getter] of Object.entries({ videoWidth: () => width, videoHeight: () => height, readyState: () => window.__dni.noFrame ? 0 : 4 })) Object.defineProperty(HTMLVideoElement.prototype, property, { configurable: true, get: getter });
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', { configurable: true, set(value) { this.__syntheticSource = value; }, get() { return this.__syntheticSource; } });
    HTMLMediaElement.prototype.play = function() { return new Promise((resolve, reject) => { window.__dni.rejectPlay = reject; if (!window.__dni.latePlay) resolve(); }); };
    const getUserMedia = async constraints => {
      window.__dni.calls++; window.__dni.constraints = constraints;
      if (window.__dni.error) throw new DOMException('SYNTHETIC', window.__dni.error);
      const stream = { getTracks: () => [{ stop: () => window.__dni.stopped++ }] };
      if (window.__dni.late) await new Promise(resolve => { window.__dni.resolvePermission = resolve; });
      return stream;
    };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    const sendOriginal = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
      if (body instanceof FormData) {
        const upload = { fields: {}, files: [] };
        window.__dni.uploads.push(upload);
        for (const [name, value] of body.entries()) {
          if (value instanceof Blob) {
            const file = { field: name, type: value.type, bytes: [] }; upload.files.push(file);
            value.arrayBuffer().then(bytes => { file.bytes = [...new Uint8Array(bytes)]; });
          } else upload.fields[name] = value;
        }
      }
      return sendOriginal.call(this, body);
    };
  }, { phone, width, height });
  return state;
}

export async function openEntry(page, entry = 'mobile', context = contextSnapshot) {
  const url = entry === 'inline' ? '/e2e/harness.html' : `/subir-dni?${new URLSearchParams({ leadId: '42', token: 'synthetic-token', solicitudId: context.solicitudId, captureSessionId: context.captureSessionId, baseRevision: context.baseRevision })}`;
  await page.goto(url);
}

export async function takePhoto(page, side = 'frente', { confirm = true } = {}) {
  await page.getByRole('button', { name: `Sacar foto del ${side}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Activar cámara', exact: true }).click();
  await dialog.getByRole('button', { name: 'Capturar', exact: true }).click();
  await expect(dialog.getByRole('img')).toBeVisible();
  if (confirm) {
    await dialog.getByRole('button', { name: 'Usar esta foto', exact: true }).click();
    const label = side === 'frente' ? 'Frente del DNI' : 'Dorso del DNI';
    await expect.poll(() => page.getByAltText(label, { exact: true }).evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  }
}

export async function takePair(page) { await takePhoto(page); await takePhoto(page, 'dorso'); }
