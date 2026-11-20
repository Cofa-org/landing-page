import { expect } from '@playwright/test';
import { once } from 'node:events';
import { createServer } from 'node:http';

const harnessOrigin = 'http://127.0.0.1:4179';

export const contextSnapshot = { solicitudId: '81', captureSessionId: 'a1234567-1234-4123-8123-123456789abc', baseRevision: 'a'.repeat(64), canCapture: true, estado_onboarding: 'CELULAR_VALIDADO', dniReceivedForSession: false, receivedUploadId: null, receiptKind: 'none' };

export const guideMarks = [
  { x: .08, y: .08, rgb: [220, 30, 30] },
  { x: .92, y: .08, rgb: [30, 160, 50] },
  { x: .08, y: .92, rgb: [30, 60, 220] },
  { x: .92, y: .92, rgb: [230, 190, 20] },
];
export const outsideMark = [240, 20, 210];

function uploadResponse(state, body) {
  if (state.error === 'network') return null;
  if (state.error?.html) return { status: 502, contentType: 'text/html', body: '<h1>PRIVATE-UPSTREAM-MARKER</h1>' };
  if (state.error) {
    const { status, cause, side, httpStatus } = state.error;
    return { status: httpStatus ?? status, json: { success: false, status, cause, message: 'PRIVATE-UPSTREAM-MARKER',
      data: { category: status === 422 ? 'capture' : 'technical', side: side ?? null, retryable: [429, 502, 503].includes(status) } } };
  }
  const uploadId = /name="uploadId"\r\n\r\n([^\r]+)/.exec(body)?.[1];
  state.receipt = { ...state.context, uploadId, dniReceivedForSession: true, estado_onboarding: 'DNI_SUBIDO', documentValidation: 'not_performed' };
  return { status: 200, json: { success: true, data: state.receipt } };
}

async function listenForMultipart(page, state) {
  // WebKit's interception metadata omits Blob payloads. Read the bytes on loopback.
  const server = createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', harnessOrigin);
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'POST');
      response.setHeader('Access-Control-Allow-Headers', 'authorization,x-api-key,x-callbell-session-id');
      response.writeHead(204).end();
      return;
    }
    if (request.method !== 'POST') {
      response.writeHead(405).end();
      return;
    }
    const chunks = [];
    try {
      for await (const chunk of request) chunks.push(chunk);
    } catch {
      response.destroy();
      return;
    }
    const body = Buffer.concat(chunks);
    state.multipart.push({ contentType: request.headers['content-type'], body });
    const result = uploadResponse(state, body.toString());
    if (!result) {
      response.destroy();
      return;
    }
    response.writeHead(result.status, { 'Content-Type': result.contentType ?? 'application/json' });
    response.end(result.body ?? JSON.stringify(result.json));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  page.once('close', () => {
    server.close();
    server.closeAllConnections();
  });
  return `http://127.0.0.1:${server.address().port}/upload`;
}

export async function installSyntheticCapture(page, { phone, width = 1600, height = 1200, inspectMultipart = false } = {}) {
  const state = { context: { ...contextSnapshot }, error: null, contextError: null, contextGets: 0, uploads: 0, blocked: [], delay: 0, multipart: [], receipt: null };
  const multipartUrl = inspectMultipart ? await listenForMultipart(page, state) : null;
  // Routes are installed BEFORE navigation. No provider request can leave the browser.
  await page.context().route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'blob:' && new URL(url.pathname).origin === harnessOrigin) return route.continue();
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
        if (multipartUrl) return route.continue({ url: multipartUrl });
        const response = uploadResponse(state, route.request().postData() ?? '');
        return response ? route.fulfill(response) : route.abort('failed');
      }
      return route.fulfill({ status: 200, json: { success: true, data: { estado_onboarding: 'CELULAR_VALIDADO' } } });
    }
    return route.continue();
  });
  await page.addInitScript(({ phone, width, height, guideMarks, outsideMark }) => {
    Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { mobile: phone } });
    window.__dni = { calls: 0, stopped: 0, uploads: [], error: null, late: false, noFrame: false, nullBlob: false, continuationFailure: false, continued: 0 };
    const fixture = document.createElement('canvas');
    const ctx = fixture.getContext('2d');
    window.__dni.setFrame = (width, height, { notify = true } = {}) => {
      fixture.width = width;
      fixture.height = height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      const unit = Math.floor(Math.min(width / 8, height / 5));
      const cropWidth = unit * 8;
      const cropHeight = unit * 5;
      const left = Math.floor((width - cropWidth) / 2);
      const top = Math.floor((height - cropHeight) / 2);
      ctx.fillStyle = `rgb(${outsideMark.join(',')})`;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.fillRect(left, top, cropWidth, cropHeight);
      const size = unit * .3;
      for (const { x, y, rgb } of guideMarks) {
        ctx.fillStyle = `rgb(${rgb.join(',')})`;
        ctx.fillRect(left + x * cropWidth - size / 2, top + y * cropHeight - size / 2, size, size);
      }
      ctx.fillStyle = 'black';
      ctx.font = `${Math.round(cropWidth / 20)}px monospace`;
      ctx.fillText('PRUEBA SIN VALIDEZ', left + cropWidth * .15, top + cropHeight * .3);
      ctx.fillText('ABC0123456789', left + cropWidth * .15, top + cropHeight * .45);
      for (let y = top + cropHeight * .55; y < top + cropHeight * .8; y += 8) {
        ctx.fillRect(left + cropWidth * .15, y, cropWidth * .65, 2);
      }
      if (notify) document.querySelector('video')?.dispatchEvent(new Event('resize'));
    };
    window.__dni.setFrame(width, height, { notify: false });
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(source, ...args) {
      if (!(source instanceof HTMLVideoElement)) return draw.call(this, source, ...args);
      window.__dni.draws = (window.__dni.draws ?? 0) + 1;
      return draw.call(this, fixture, ...args);
    };
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    window.__dni.originalPng = () => new Promise(resolve => {
      toBlob.call(fixture, async blob => resolve([...new Uint8Array(await blob.arrayBuffer())]), 'image/png');
    });
    window.__dni.fixturePoster = () => fixture.toDataURL('image/png');
    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
      if (window.__dni.nullBlob) return callback(null);
      return toBlob.call(this, blob => {
        if (window.__dni.pauseEncoding) window.__dni.finishEncoding = () => callback(blob);
        else callback(blob);
      }, ...args);
    };
    for (const [property, getter] of Object.entries({ videoWidth: () => fixture.width, videoHeight: () => fixture.height, readyState: () => window.__dni.noFrame ? 0 : 4 })) Object.defineProperty(HTMLVideoElement.prototype, property, { configurable: true, get: getter });
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
        const upload = { fields: {} };
        window.__dni.uploads.push(upload);
        for (const [name, value] of body.entries()) {
          if (typeof value === 'string') upload.fields[name] = value;
        }
      }
      return sendOriginal.call(this, body);
    };
  }, { phone, width, height, guideMarks, outsideMark });
  return state;
}

export async function openEntry(page, entry = 'mobile', context = contextSnapshot) {
  const url = entry === 'inline' ? '/e2e/harness.html' : `/subir-dni?${new URLSearchParams({ leadId: '42', token: 'synthetic-token', solicitudId: context.solicitudId, captureSessionId: context.captureSessionId, baseRevision: context.baseRevision })}`;
  await page.goto(url);
}

export async function takePhoto(page, side = 'frente', { confirm = true } = {}) {
  await page.getByRole('button', { name: `Sacar foto del ${side}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('list', { name: 'Consejos para sacar las fotos' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Activar cámara', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Capturar', exact: true }).click();
  await expect(dialog.getByRole('img')).toBeVisible();
  await expect(dialog.getByText('Comprobá que el DNI se vea completo, enfocado y sin reflejos. Los datos deben leerse con claridad.')).toBeVisible();
  if (confirm) {
    await dialog.getByRole('button', { name: 'Usar esta foto', exact: true }).click();
    const label = side === 'frente' ? 'Frente del DNI' : 'Dorso del DNI';
    await expect.poll(() => page.getByAltText(label, { exact: true }).evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  }
}

export async function takePair(page) { await takePhoto(page); await takePhoto(page, 'dorso'); }
