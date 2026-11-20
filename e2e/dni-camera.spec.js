import { test, expect } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import qrcodeReact from 'qrcode.react';
import { writeFile } from 'node:fs/promises';
import { contextSnapshot, guideMarks, outsideMark, installSyntheticCapture, openEntry, takePhoto, takePair } from './fixtures/dni-camera.js';

const { QRCodeSVG } = qrcodeReact;
const receivedText = 'Ya recibimos las fotos de tu DNI. Volvé a la computadora para continuar con tu solicitud.';
const isPhone = info => info.project.name.endsWith('-phone');
const wideFrame = { width: 1280, height: 720, crop: { left: 64, top: 0, width: 1152, height: 720 } };
const tallFrame = { width: 720, height: 1280, crop: { left: 0, top: 415, width: 720, height: 450 } };

async function expectProjectedGuide(video, frame) {
  await expect.poll(() => video.evaluate((node, { width, height, crop }) => {
    const box = node.getBoundingClientRect();
    const guide = node.parentElement.querySelector('[aria-hidden] > div')?.getBoundingClientRect();
    if (!guide || node.videoWidth !== width || node.videoHeight !== height) return null;
    const scale = Math.min(box.width / width, box.height / height);
    const left = box.x + (box.width - width * scale) / 2 + crop.left * scale;
    const top = box.y + (box.height - height * scale) / 2 + crop.top * scale;
    return Math.max(Math.abs(guide.x - left), Math.abs(guide.y - top),
      Math.abs(guide.width - crop.width * scale), Math.abs(guide.height - crop.height * scale));
  }, frame)).toBeLessThan(.6);
  await expect(video).toHaveCSS('object-fit', 'contain');
}

async function screenshotPixels(locator, points, path) {
  const png = await locator.screenshot({ path, scale: 'css' });
  return locator.page().evaluate(async ({ png, points, outsideMark }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let outsidePixels = 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (outsideMark.every((channel, index) => channel === pixels[offset + index])) outsidePixels++;
    }
    return {
      sampled: points.map(({ x, y }) => [...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data].slice(0, 3)),
      outsidePixels,
    };
  }, { png: png.toString('base64'), points, outsideMark });
}

async function expectPreviewGeometry(image, frame) {
  const geometry = await image.evaluate((node, { width, height, crop }) => {
    const imageBox = node.getBoundingClientRect();
    const box = node.parentElement.getBoundingClientRect();
    const scale = box.width / crop.width;
    return { width: box.width, height: box.height, differences: [
      box.height - crop.height * scale, imageBox.width - width * scale, imageBox.height - height * scale,
      imageBox.x - box.x + crop.left * scale, imageBox.y - box.y + crop.top * scale,
    ] };
  }, frame);
  expect(Math.max(...geometry.differences.map(Math.abs))).toBeLessThan(.6);
  return geometry;
}

async function expectCroppedPreview(image, frame, path) {
  const cropBox = image.locator('..');
  await expect.poll(() => image.evaluate(node => [node.naturalWidth, node.naturalHeight])).toEqual([frame.width, frame.height]);
  await expect(cropBox).toHaveCSS('overflow', 'hidden');
  const geometry = await expectPreviewGeometry(image, frame);
  const points = guideMarks.map(({ x, y }) => ({ x: x * geometry.width, y: y * geometry.height }));
  expect(await screenshotPixels(cropBox, points, path)).toEqual({ sampled: guideMarks.map(({ rgb }) => rgb), outsidePixels: 0 });
}

async function expectZoomedPreview(image, frame, path) {
  const viewport = image.locator('../..');
  for (const edge of ['left', 'right']) {
    const geometry = await viewport.evaluate((node, edge) => {
      node.scrollLeft = edge === 'left' ? 0 : node.scrollWidth;
      const viewport = node.getBoundingClientRect();
      const cropBox = node.firstElementChild.getBoundingClientRect();
      return { x: cropBox.x - viewport.x, y: cropBox.y - viewport.y, viewportWidth: viewport.width };
    }, edge);
    const { width, height } = await expectPreviewGeometry(image, frame);
    expect(width / geometry.viewportWidth).toBeCloseTo(2, 1);
    const marks = guideMarks.filter(({ x }) => edge === 'left' ? x < .5 : x > .5);
    const points = marks.map(({ x, y }) => ({ x: geometry.x + x * width, y: geometry.y + y * height }));
    expect(await screenshotPixels(viewport, points, `${path}-zoom-${edge}.png`)).toEqual({ sampled: marks.map(({ rgb }) => rgb), outsidePixels: 0 });
  }
}

function readMultipart({ contentType, body }) {
  const boundary = /boundary="?([^";]+)"?/.exec(contentType)[1];
  return body.toString('latin1').split(`--${boundary}`).slice(1, -1).map(part => {
    const headerEnd = part.indexOf('\r\n\r\n');
    const headers = part.slice(0, headerEnd);
    return {
      name: /name="([^"]+)"/.exec(headers)[1],
      type: /Content-Type: ([^\r]+)/i.exec(headers)?.[1],
      bytes: Buffer.from(part.slice(headerEnd + 4, -2), 'latin1'),
    };
  });
}

for (const entry of ['mobile', 'inline']) for (const frame of [wideFrame, tallFrame]) test(`${entry} short landscape camera contains frame and guide ${frame.width}x${frame.height}`, async ({page}, info) => {
  test.skip(!isPhone(info));
  await page.setViewportSize({width:844,height:300});
  await installSyntheticCapture(page, { phone: true, width: frame.width, height: frame.height });
  await openEntry(page,entry);
  await page.evaluate(()=>{const host=document.createElement('div');host.id='callbell-livechat-host';host.textContent='SYNTHETIC CHAT';document.body.append(host);});
  await page.getByRole('button',{name:'Sacar foto del frente',exact:true}).click();
  const dialog=page.getByRole('dialog');
  const shutter=dialog.getByRole('button',{name:'Capturar',exact:true});
  await expect(shutter).toBeVisible();
  await expect(page.locator('#callbell-livechat-host')).toBeHidden();
  for (const viewport of [{width:844,height:300},{width:740,height:260},{width:390,height:700},{width:844,height:300}]) {
    await page.setViewportSize(viewport);
    await expectProjectedGuide(dialog.locator('video'), frame);
    await expect.poll(()=>dialog.locator('video').evaluate(video=>{
      const box=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      const container=video.parentElement;
      const guide=container.querySelector('[aria-hidden] > div');
      const f=box(container),g=box(guide),v=box(video);
      const inside=(a,b)=>a.x>=b.x-1&&a.y>=b.y-1&&a.right<=b.right+1&&a.bottom<=b.bottom+1;
      return inside(g,f)&&inside(v,f)&&f.height>100&&Math.abs(f.width/f.height-video.videoWidth/video.videoHeight)<.02&&inside(f,{x:0,y:0,right:innerWidth,bottom:innerHeight});
    })).toBe(true);
    if (viewport.width>viewport.height) {
      const f=await dialog.locator('video').boundingBox(),b=await shutter.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(f.x+f.width);
      expect(b.y+b.height).toBeLessThanOrEqual(viewport.height);
    }
  }
  const video = dialog.locator('video');
  await video.evaluate(node => node.style.setProperty('background-color', '#fff'));
  const guide = video.locator('..').locator(':scope > [aria-hidden] > div');
  const guideBox = await guide.boundingBox();
  const edgeSamples = [
    { x: 3, y: guideBox.height / 2 },
    { x: guideBox.width - 4, y: guideBox.height / 2 },
    // Sample inside the dark band even when the screenshot starts on a fractional pixel.
    { x: guideBox.width / 2, y: 4 },
    { x: guideBox.width / 2, y: guideBox.height - 4 },
  ];
  const { sampled } = await screenshotPixels(guide, edgeSamples, info.outputPath('guide-on-white.png'));
  expect(sampled).toEqual(Array.from({ length: edgeSamples.length }, () => [34, 34, 34]));
  await video.evaluate(node => node.style.removeProperty('background-color'));
  await video.evaluate(node => node.style.setProperty('height', '80%'));
  await expectProjectedGuide(video, frame);
  await video.evaluate(node => node.style.removeProperty('height'));
  await expectProjectedGuide(video, frame);
  await page.screenshot({path:info.outputPath('landscape-camera.png'),fullPage:true});
  await shutter.click();
  await expect(dialog.getByRole('img')).toBeVisible();
  await dialog.getByRole('button', { name: 'Ampliar foto' }).click();
  const confirm = dialog.getByRole('button', { name: 'Usar esta foto' });
  await confirm.scrollIntoViewIfNeeded();
  await expect(confirm).toBeInViewport({ ratio: 1 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#callbell-livechat-host')).toBeVisible();
});

test.afterEach(async ({ page }) => { await expect(page.locator('a[href*="/subir-dni?"], a[href*="wa.me"]')).toHaveCount(0); await page.close(); await page.context().unrouteAll({ behavior: 'ignoreErrors' }); });

for (const entry of ['mobile', 'inline']) {
  test(`${entry} mobile capture intro stays readable`, async ({ page }, info) => {
    test.skip(!isPhone(info));
    await installSyntheticCapture(page, { phone: true });
    await openEntry(page, entry);
    await expect(page.getByRole('heading', { name: 'Sacá las fotos de tu DNI' })).toBeVisible();
    const tips = page.getByRole('list', { name: 'Consejos para sacar las fotos' });
    await expect(tips.getByRole('listitem')).toHaveCount(3);
    const actions = page.getByRole('button', { name: /^(Sacar foto del frente|Sacar foto del dorso|Enviar fotos|Hablar con un asesor)$/ });
    await expect(actions).toHaveText(['Sacar foto del frente', 'Sacar foto del dorso', 'Enviar fotos', 'Hablar con un asesor']);
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const action of await actions.all()) {
        await action.scrollIntoViewIfNeeded();
        await expect(action).toBeInViewport({ ratio: 1 });
        expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44);
      }
    }
    await tips.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath('capture-intro.png'), fullPage: true });
  });
}

test('desktop QR keeps the title and help in place after a delayed response', async ({ page }, info) => {
  test.skip(isPhone(info));
  await installSyntheticCapture(page, { phone: false });
  const contextResponse = Promise.withResolvers();
  await page.route('**/api/lead-registration/dni-contexto/*', async route => {
    await contextResponse.promise;
    await route.fallback();
  });
  const form = page.locator('form');
  const title = form.getByRole('heading', { name: 'Subí las fotos de tu DNI' });
  const help = form.getByRole('button', { name: 'Hablar con un asesor' });
  const qr = form.getByRole('img', { name: 'Escaneá con tu celular' });
  let before;
  try {
    await openEntry(page, 'inline');
    await expect(help).toBeVisible();
    await expect(form.getByRole('status')).toHaveText('Preparando el código QR…');
    await expect(qr).toHaveCount(0);
    before = { title: await title.boundingBox(), help: await help.boundingBox() };
  } finally {
    contextResponse.resolve();
  }

  await expect(qr).toBeVisible();
  await expect(form.getByRole('status')).toHaveText('Esperando las fotos de tu celular…');
  expect(await title.boundingBox()).toEqual(before.title);
  expect(await help.boundingBox()).toEqual(before.help);
});

test('desktop touch/webcam offers context-bound scannable QR and polls the phone receipt', async ({ page, browser }, info) => {
  test.skip(isPhone(info));
  const desktop = await installSyntheticCapture(page, { phone: false });
  await openEntry(page, 'inline');
  await expect(page.getByText("Escaneá el código con tu celular para sacar las fotos de tu DNI.", { exact: true })).toBeVisible();
  const qr = page.getByRole('img', { name: 'Escaneá con tu celular' });
  await expect(qr).toBeVisible();
  const expectedUrl = new URL('/subir-dni', page.url());
  expectedUrl.search = new URLSearchParams({ leadId: '42', token: 'synthetic-token', solicitudId: contextSnapshot.solicitudId, captureSessionId: contextSnapshot.captureSessionId, baseRevision: contextSnapshot.baseRevision });
  const expectedSvg = renderToStaticMarkup(createElement(QRCodeSVG, { value: expectedUrl.href, size: 180 }));
  const expectedPaths = [...expectedSvg.matchAll(/ d="([^"]*)"/g)];
  await expect(qr.locator('path').last()).toHaveAttribute('d', expectedPaths.at(-1)[1]);
  await expect(page.locator('input[type=file], video, [ondrop], [onpaste]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__dni.calls)).toBe(0);

  await page.screenshot({ path: info.outputPath(`${info.project.name}-qr.png`), fullPage: true });
  const pollingBeforeUpload = desktop.contextGets;
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
  try {
    const phone = await phoneContext.newPage();
    const phoneState = await installSyntheticCapture(phone, { phone: true });
    await phone.goto(expectedUrl.href);
    await takePair(phone);
    await phone.getByRole('button', { name: 'Enviar fotos', exact: true }).click();
    await expect(phone.getByRole('status')).toHaveText(receivedText);
    const { uploadId, captureSessionId, solicitudId } = phoneState.receipt;
    expect(uploadId).toMatch(/^[a-f0-9-]{36}$/);
    desktop.context = { ...desktop.context, captureSessionId, solicitudId, baseRevision: 'b'.repeat(64),
      receivedUploadId: uploadId, dniReceivedForSession: true, receiptKind: 'current_session', estado_onboarding: 'DNI_SUBIDO' };
    await expect.poll(() => page.evaluate(() => window.__dni.continued)).toBe(1);
    await expect(qr).toHaveCount(0);
    expect(desktop.contextGets).toBeGreaterThan(pollingBeforeUpload);
    expect(desktop.uploads).toBe(0);
  } finally {
    await phoneContext.close();
  }
});

for (const entry of ['mobile', 'inline']) test(`${entry} captures original PNG pair without persistent image data or console disclosure`, async ({ page }, info) => {
  test.skip(!isPhone(info));
  const consoleMessages = [];
  page.on('console', message => {
    const text = message.text();
    // Firefox adds the current document URL to its own unused hero preload warning.
    const nativePreloadWarning = message.type() === 'warning'
      && message.location().url === page.url() && message.location().lineNumber === 0
      && text.startsWith('[JavaScript Warning: "The resource at')
      && text.includes('/img/hero-loan-sim-600.webp” preloaded with link preload was not used within a few seconds.');
    if (!nativePreloadWarning) consoleMessages.push(text);
  });
  const state = await installSyntheticCapture(page, { phone: true, width: wideFrame.width, height: wideFrame.height, inspectMultipart: true });
  await openEntry(page, entry);
  const front = await page.evaluate(() => window.__dni.originalPng());
  await takePhoto(page);
  await page.evaluate(({ width, height }) => window.__dni.setFrame(width, height), tallFrame);
  const back = await page.evaluate(() => window.__dni.originalPng());
  await takePhoto(page, 'dorso');
  await expect(page.locator('input[type=file], [ondrop], [onpaste]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Enviar fotos', exact: true }).click();
  if (entry === 'mobile') {
    const receiptHeading = page.getByRole('heading', { name: '¡Fotos enviadas!', exact: true });
    await expect(receiptHeading).toBeFocused();
    await expect(page.getByRole('status')).toHaveText(receivedText);
    await expect(page.getByRole('button')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Sacá las fotos de tu DNI' })).toHaveCount(0);
    await page.screenshot({path:info.outputPath('received-photos.png'),fullPage:true});
  } else {
    await expect(page.getByText('Recibimos tus fotos.', { exact: true })).toBeVisible();
  }
  expect(state.multipart).toHaveLength(1);
  const parts = readMultipart(state.multipart[0]);
  const files = parts.filter(({ type }) => type);
  expect(files.map(({ name, type }) => ({ name, type }))).toEqual([
    { name: 'dniFront', type: 'image/png' }, { name: 'dniBack', type: 'image/png' },
  ]);
  expect(files[0].bytes.equals(Buffer.from(front))).toBe(true);
  expect(files[1].bytes.equals(Buffer.from(back))).toBe(true);
  const fields = parts.filter(({ type }) => !type);
  expect(fields.filter(({ name }) => name === 'captureProfile').map(({ bytes }) => bytes.toString())).toEqual(['DNI_GUIDE_8X5_V1']);
  const values = Object.fromEntries(fields.map(({ name, bytes }) => [name, bytes.toString()]));
  expect(values).toMatchObject({ solicitudId: '81', captureSessionId: contextSnapshot.captureSessionId, baseRevision: contextSnapshot.baseRevision, rotationFront: '0', rotationBack: '0' });
  expect(values.uploadId).toMatch(/^[a-f0-9-]{36}$/);
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toMatch(/data:image|blob:|base64|PRUEBA SIN VALIDEZ/);
  expect(consoleMessages.join('\n')).not.toMatch(/synthetic-token|PRIVATE-UPSTREAM|base64|blob:|a1234567/);
});

for (const frame of [wideFrame, tallFrame]) test(`actual preview geometry, original orientation, zoom, corners, focus (${frame.width}x${frame.height})`, async ({ page }, info) => {
  await installSyntheticCapture(page, { phone: true, width: frame.width, height: frame.height });
  await openEntry(page); const opener = page.getByRole('button', { name: 'Sacar foto del frente', exact: true });
  await opener.click(); const dialog = page.getByRole('dialog'); const close = dialog.getByRole('button', { name: 'Cerrar cámara' });
  const video = dialog.locator('video');
  await expect(dialog.getByRole('button', { name: 'Capturar', exact: true })).toBeVisible();
  await expectProjectedGuide(video, frame);
  await video.evaluate(node => { node.poster = window.__dni.fixturePoster(); });
  const videoBox = await video.boundingBox();
  const outerPoint = frame === wideFrame ? { x: videoBox.width * .025, y: videoBox.height / 2 }
    : { x: videoBox.width / 2, y: videoBox.height * .15 };
  const { sampled, outsidePixels } = await screenshotPixels(video, [outerPoint, { x: videoBox.width / 2, y: videoBox.height / 2 }], info.outputPath('live-mask.png'));
  expect(outsidePixels).toBe(0);
  for (const [index, channel] of outsideMark.entries()) expect(Math.abs(sampled[0][index] - channel * .45)).toBeLessThan(3);
  expect(sampled[1]).toEqual([255, 255, 255]);
  await expect(close).toBeFocused(); await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button', { name: 'Capturar', exact: true })).toBeFocused(); await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await dialog.getByRole('button', { name: 'Capturar', exact: true }).click();
  await expect(dialog.getByRole('img')).toBeVisible();
  await expect(dialog.getByRole('button', {name:/Girar/})).toHaveCount(0);
  const resolutionWarning = dialog.getByText(/La resolución del encuadre es baja/);
  await expect(resolutionWarning).toHaveCount(frame === wideFrame ? 0 : 1);
  const image = dialog.getByRole('img');
  await expectCroppedPreview(image, frame, info.outputPath('review.png'));
  await dialog.getByRole('button', { name: 'Ampliar foto', exact: true }).click();
  await expectZoomedPreview(image, frame, info.outputPath('review'));
  await dialog.getByRole('button', { name: 'Reducir foto', exact: true }).click();
  await expectCroppedPreview(image, frame);
  const targets = await dialog.locator('button,a').evaluateAll(nodes => nodes.filter(node=>node.getClientRects().length).map(node => ({ name:node.textContent, height:node.getBoundingClientRect().height, width:node.getBoundingClientRect().width })));
  expect(targets.every(target=>target.height>=44 && target.width>=44)).toBe(true);
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for (const entry of ['mobile', 'inline']) test(`${entry} updates the guide before shutter and preserves shutter geometry while encoding`, async ({ page }, info) => {
  test.skip(!isPhone(info));
  await installSyntheticCapture(page, { phone: true, width: wideFrame.width, height: wideFrame.height });
  await openEntry(page, entry);
  await page.getByRole('button', { name: 'Sacar foto del frente', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const video = dialog.locator('video');
  const shutter = dialog.getByRole('button', { name: 'Capturar', exact: true });
  await expect(shutter).toBeEnabled();
  await expectProjectedGuide(video, wideFrame);

  // Change the natural size on the same task as the click, before any resize notification arrives.
  await shutter.evaluate((button, { width, height }) => {
    window.__dni.setFrame(width, height, { notify: false });
    button.click();
  }, tallFrame);
  expect(await page.evaluate(() => window.__dni.draws ?? 0)).toBe(0);
  await expectProjectedGuide(video, tallFrame);
  await page.setViewportSize({ width: 844, height: 390 });
  await expectProjectedGuide(video, tallFrame);

  await page.evaluate(() => { window.__dni.pauseEncoding = true; });
  await shutter.click();
  await expect.poll(() => page.evaluate(() => typeof window.__dni.finishEncoding)).toBe('function');
  expect(await page.evaluate(() => window.__dni.draws)).toBe(1);
  await page.evaluate(({ width, height }) => {
    window.__dni.setFrame(width, height);
    window.__dni.finishEncoding();
  }, wideFrame);
  const image = dialog.getByRole('img');
  await expectCroppedPreview(image, tallFrame, info.outputPath('review-after-rotation.png'));
  await expect(dialog.getByText(/La resolución del encuadre es baja/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Usar esta foto', exact: true }).click();
  await expectCroppedPreview(page.getByAltText('Frente del DNI', { exact: true }), tallFrame);
});

for (const [status,cause] of [[400,'DNI_CAPTURE_INVALID_INPUT'],[401,'DNI_SESSION_EXPIRED'],[403,'DNI_FORBIDDEN'],[404,'DNI_CAPTURE_NOT_FOUND'],[409,'DNI_CAPTURE_CONTEXT_REQUIRED'],[409,'DNI_CAPTURE_CONTEXT_CHANGED'],[409,'DNI_CAPTURE_SUPERSEDED'],[409,'DNI_CAPTURE_STEP_UNAVAILABLE'],[413,'DNI_FILE_TOO_LARGE'],[413,'DNI_IMAGE_LIMIT'],[415,'DNI_IMAGE_UNSUPPORTED'],[422,'DNI_IMAGE_INVALID'],[429,'DNI_UPLOAD_BUSY'],[503,'DNI_IMAGE_TIMEOUT'],[503,'DNI_STORAGE_UNAVAILABLE'],[503,'DNI_CAPTURE_SAVE_FAILED'],[502,'DNI_TECHNICAL_ERROR']]) test(`safe ${status} ${cause} preserves previews without file fallback`, async ({ page }, info) => {
  test.skip(!isPhone(info)); const state = await installSyntheticCapture(page,{phone:true}); await openEntry(page); await takePair(page);
  state.error = {status,cause,side:status===422?'back':null}; await page.getByRole('button',{name:'Enviar fotos',exact:true}).click();
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByRole('alert')).not.toContainText('PRIVATE-UPSTREAM');
  await expect(page.getByAltText('Frente del DNI',{exact:true})).toBeVisible(); await expect(page.getByAltText('Dorso del DNI',{exact:true})).toBeVisible(); await expect(page.locator('input[type=file]')).toHaveCount(0);
  expect(state.uploads).toBe(1);
});

for (const failure of ['network','html','legacy200']) test(`transport ${failure} explicit retry keeps operation`,async({page},info)=>{
  test.skip(!isPhone(info)); const state=await installSyntheticCapture(page,{phone:true,inspectMultipart:true}); await openEntry(page); await takePair(page);
  state.error=failure==='network'?'network':failure==='html'?{html:true}:{httpStatus:200,status:503,cause:'DNI_STORAGE_UNAVAILABLE'};
  await page.getByRole('button',{name:'Enviar fotos',exact:true}).click(); await expect(page.getByRole('alert')).toBeVisible();
  state.error=null; await page.getByRole('button',{name:'Enviar fotos',exact:true}).click(); await expect(page.getByRole('heading', { name: '¡Fotos enviadas!', exact: true })).toBeVisible();
  expect(state.multipart).toHaveLength(2);
  const [first, retry] = state.multipart.map(readMultipart);
  const files = first.filter(({ type }) => type);
  expect(files.map(({ name, type }) => ({ name, type }))).toEqual([
    { name: 'dniFront', type: 'image/png' }, { name: 'dniBack', type: 'image/png' },
  ]);
  for (const { bytes } of files) {
    expect(bytes.length).toBeGreaterThan(8);
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  expect(first.find(({ name }) => name === 'captureProfile').bytes.toString()).toBe('DNI_GUIDE_8X5_V1');
  expect(retry).toEqual(first);
});

test('permission late, no frame, null blob, playback failure and cancelled retake release safely',async({page},info)=>{
  test.skip(!isPhone(info)); await installSyntheticCapture(page,{phone:true}); await openEntry(page);
  await page.evaluate(()=>window.__dni.late=true); await page.getByRole('button',{name:'Sacar foto del frente',exact:true}).click();
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{ window.__dni.resolvePermission(); window.__dni.late=false; }); await expect.poll(()=>page.evaluate(()=>window.__dni.stopped)).toBe(1);
  for(const mode of ['noFrame','nullBlob']) {
    await page.getByRole('button',{name:'Sacar foto del frente',exact:true}).click();
    await expect(page.getByRole('dialog').getByRole('button',{name:'Capturar',exact:true})).toBeVisible();
    await page.evaluate(mode=>window.__dni[mode]=true,mode);
    await page.getByRole('dialog').getByRole('button',{name:'Capturar',exact:true}).click(); await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible(); await page.keyboard.press('Escape'); await page.evaluate(mode=>window.__dni[mode]=false,mode);
  }
  await page.evaluate(()=>window.__dni.latePlay=true);
  await page.getByRole('button',{name:'Sacar foto del frente',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('status')).toBeVisible();
  await page.evaluate(()=>window.__dni.rejectPlay(new Error('synthetic playback')));
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  await page.evaluate(()=>window.__dni.latePlay=false);
  await page.getByRole('dialog').getByRole('button',{name:'Reintentar cámara',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Capturar',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('img')).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Usar esta foto',exact:true}).click();
  const url=await page.getByAltText('Frente del DNI',{exact:true}).getAttribute('src');
  await page.getByRole('button',{name:'Volver a sacar el frente',exact:true}).click(); await page.keyboard.press('Escape'); expect(await page.getByAltText('Frente del DNI',{exact:true}).getAttribute('src')).toBe(url);
});

for (const entry of ['mobile', 'inline']) test(`${entry} camera loader waits for a frame and shows advisor only on error`, async ({ page }, info) => {
  test.skip(!isPhone(info));
  if (entry === 'inline') await page.emulateMedia({ reducedMotion: 'reduce' });
  const state = await installSyntheticCapture(page, { phone: true });
  await openEntry(page, entry);
  await page.evaluate(() => { window.__dni.late = true; window.__dni.noFrame = true; });
  await page.getByRole('button', { name: 'Sacar foto del frente', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('status')).toHaveText(/Abriendo cámara/);
  const spinnerMoves = await dialog.getByRole('status').locator('div').evaluateAll(nodes => nodes.some(node => getComputedStyle(node).animationName !== 'none'));
  expect(spinnerMoves).toBe(entry !== 'inline');
  await expect(dialog.getByRole('button', { name: 'Capturar', exact: true })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Hablar con un asesor', exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath(`${entry}-camera-opening.png`), fullPage: true });
  await page.evaluate(() => { window.__dni.late = false; window.__dni.resolvePermission(); });
  await expect.poll(() => page.evaluate(() => !!window.__dni.rejectPlay)).toBe(true);
  await expect(dialog.getByRole('status')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Capturar', exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    window.__dni.noFrame = false;
    document.querySelector('video').dispatchEvent(new Event('loadeddata'));
  });
  await expect(dialog.getByRole('button', { name: 'Capturar', exact: true })).toBeEnabled();
  await expect(dialog.getByRole('status')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Hablar con un asesor', exact: true })).toHaveCount(0);
  await page.evaluate(() => document.querySelector('video').dispatchEvent(new Event('error')));
  await expect(dialog.getByRole('alert')).toContainText('No pudimos iniciar el video');
  await expect(dialog.getByRole('button', { name: 'Hablar con un asesor', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath(`${entry}-camera-error.png`), fullPage: true });
  await expect.poll(() => page.evaluate(() => window.__dni.stopped)).toBe(1);
  await dialog.getByRole('button', { name: 'Reintentar cámara', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Capturar', exact: true })).toBeEnabled();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Hablar con un asesor', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Capturar', exact: true }).click();
  await expect(dialog.getByRole('img')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Hablar con un asesor', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__dni.stopped)).toBe(2);
  expect(state.uploads).toBe(0);
});

for(const error of ['NotAllowedError','NotFoundError','NotReadableError','OverconstrainedError','unsupported']) test(`camera ${error} safe alternatives without file input`,async({page},info)=>{
  test.skip(!isPhone(info)); await installSyntheticCapture(page,{phone:true}); await openEntry(page);
  await page.evaluate(error=>{ if(error==='unsupported') Object.defineProperty(navigator,'mediaDevices',{value:{},configurable:true}); else window.__dni.error=error; },error);
  await page.getByRole('button',{name:'Sacar foto del frente',exact:true}).click(); await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible(); await expect(page.getByRole('dialog').getByRole('button',{name:'Hablar con un asesor',exact:true})).toBeVisible(); await expect(page.locator('a')).toHaveCount(0); await expect(page.locator('input[type=file]')).toHaveCount(0);
});

test('double submit and cancellation never auto-retry or clear photos',async({page},info)=>{
  test.skip(!isPhone(info)); const state=await installSyntheticCapture(page,{phone:true}); await openEntry(page); await takePair(page); state.delay=1500;
  await page.getByRole('button',{name:'Enviar fotos',exact:true}).evaluate(button=>{button.click();button.click();}); await expect(page.getByRole('button',{name:'Cancelar envío',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Cancelar envío',exact:true}).click(); await expect(page.getByRole('alert')).toHaveCount(0); await expect(page.getByAltText('Frente del DNI',{exact:true})).toBeVisible(); expect(state.uploads).toBeLessThanOrEqual(1);
});

test('conflict explicit refresh keeps photos, adopts same-session winner, requires separate submit',async({page},info)=>{
  test.skip(!isPhone(info)); const state=await installSyntheticCapture(page,{phone:true}); await openEntry(page); await takePair(page); state.error={status:409,cause:'DNI_CAPTURE_SUPERSEDED'};
  await page.getByRole('button',{name:'Enviar fotos',exact:true}).click(); await expect(page.getByRole('alert')).toBeVisible();
  state.context={...state.context,baseRevision:'b'.repeat(64),dniReceivedForSession:true,receivedUploadId:'c1234567-1234-4123-8123-123456789abc',receiptKind:'current_session',estado_onboarding:'DNI_SUBIDO'};
  await page.getByRole('button',{name:'Actualizar para reintentar con estas fotos',exact:true}).click(); await expect(page.getByRole('button',{name:'Enviar fotos',exact:true})).toBeEnabled(); expect(state.uploads).toBe(1);
  state.error=null; await page.getByRole('button',{name:'Enviar fotos',exact:true}).click(); await expect(page.getByRole('heading', { name: '¡Fotos enviadas!', exact: true })).toBeVisible();
  const uploads=await page.evaluate(()=>window.__dni.uploads); expect(uploads[1].fields.baseRevision).toBe('b'.repeat(64)); expect(uploads[1].fields.uploadId).not.toBe(uploads[0].fields.uploadId);
});

test('changed QR session refuses capture and context refresh cannot silently rebind',async({page},info)=>{
  test.skip(!isPhone(info)); const state=await installSyntheticCapture(page,{phone:true}); state.context.captureSessionId='c1234567-1234-4123-8123-123456789abc'; await openEntry(page);
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByRole('button',{name:'Sacar foto del frente',exact:true})).toBeDisabled(); expect(await page.evaluate(()=>window.__dni.calls)).toBe(0);
});

test('inline receipt continuation failure can retry without uploading again',async({page},info)=>{
  test.skip(!isPhone(info)); const state=await installSyntheticCapture(page,{phone:true}); await openEntry(page,'inline'); await page.evaluate(()=>window.__dni.continuationFailure=true); await takePair(page);
  await page.getByRole('button',{name:'Enviar fotos',exact:true}).click(); await expect(page.getByRole('alert')).toContainText('Tus fotos se guardaron.'); await page.evaluate(()=>window.__dni.continuationFailure=false);
  await page.getByRole('button',{name:'Volver a intentar continuar',exact:true}).click(); await expect(page.getByRole('alert')).toHaveCount(0); expect(state.uploads).toBe(1);
});


test('environment artifacts include QR and confirmed entry, actual engine version', async ({ page, browser }, info) => {
  const phone = isPhone(info);
  const state = await installSyntheticCapture(page, { phone });
  await openEntry(page);

  if (phone) await takePair(page);
  else await expect(page.getByRole('img', { name: 'Escaneá con tu celular' })).toBeVisible();
  await page.screenshot({ path: info.outputPath(`${info.project.name}-entry.png`), fullPage: true });
  if (!phone) await page.getByRole('img', { name: 'Escaneá con tu celular' }).screenshot({ path: info.outputPath(`${info.project.name}-qr-symbol.png`) });
  await writeFile(info.outputPath(`${info.project.name}-environment.json`), JSON.stringify({ browser: browser.version(), viewport: page.viewportSize(), phoneSurface: phone, blockedExternalRequests: state.blocked.length, actualHardware: false, camera: await page.evaluate(() => ({ calls: window.__dni.calls, constraints: window.__dni.constraints, uaMobile: navigator.userAgentData.mobile })) }, null, 2));
});

test('polling session change removes QR until explicit refresh', async ({ page }, info) => {
  test.skip(isPhone(info));
  const state = await installSyntheticCapture(page, { phone: false }); await openEntry(page);
  await expect(page.getByRole('img', { name: 'Escaneá con tu celular' })).toBeVisible();
  state.context = { ...state.context, captureSessionId: 'c1234567-1234-4123-8123-123456789abc' };
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Escaneá con tu celular' })).toHaveCount(0);
  expect(await page.evaluate(() => window.__dni.calls)).toBe(0);
});

test('lost response normal refresh restores own receipt without reuploading', async ({ page }, info) => {
  test.skip(!isPhone(info));
  const state = await installSyntheticCapture(page, { phone: true }); await openEntry(page); await takePair(page);
  state.error = 'network'; await page.getByRole('button', { name: 'Enviar fotos', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  const uploadId = await page.evaluate(() => window.__dni.uploads[0].fields.uploadId);
  state.context = { ...state.context, baseRevision: 'b'.repeat(64), dniReceivedForSession: true, receivedUploadId: uploadId, receiptKind: 'current_session', estado_onboarding: 'DNI_SUBIDO' };
  // Reopen the same link: the context endpoint restores the committed own receipt before revision mismatch.
  await openEntry(page);
  await expect(page.getByRole('heading', { name: '¡Fotos enviadas!', exact: true })).toBeVisible();
  expect(state.uploads).toBe(1);
  await expect(page.getByRole('status')).toHaveText(receivedText);
  await expect(page.getByRole('button')).toHaveCount(0);
});

test('binding change while permission pending releases old work and requires a fresh camera action', async ({ page }, info) => {
  test.skip(!isPhone(info));
  const state = await installSyntheticCapture(page, { phone: true }); await openEntry(page);
  await page.evaluate(() => window.__dni.late = true);
  await page.getByRole('button', { name: 'Sacar foto del frente', exact: true }).click();
  state.context = { ...state.context, captureSessionId: 'c1234567-1234-4123-8123-123456789abc' };
  await page.evaluate(context => {
    const url = new URL(location.href); url.searchParams.set('captureSessionId', context.captureSessionId);
    history.pushState({}, '', url); dispatchEvent(new PopStateEvent('popstate'));
  }, state.context);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => { window.__dni.resolvePermission(); window.__dni.late = false; });
  await expect.poll(() => page.evaluate(() => window.__dni.stopped)).toBe(1);
  await expect(page.getByAltText('Frente del DNI', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sacar foto del frente', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.__dni.calls)).toBe(1);
});

for (const entry of ['mobile', 'inline']) test(`${entry} populated PNG paste/drop leaves both slots unchanged; low resolution camera still confirms`, async ({ page }, info) => {
  test.skip(!isPhone(info));
  const state = await installSyntheticCapture(page, { phone: true, width: 640, height: 480 }); await openEntry(page, entry);
  await expect(page.getByRole('button', { name: 'Sacar foto del frente', exact: true })).toBeEnabled();
  const payloads = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 4; canvas.height = 3;
    canvas.getContext('2d').fillRect(0, 0, 4, 3);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'synthetic-payload.png', { type: 'image/png' });
    const url = URL.createObjectURL(file); const image = new Image(); image.src = url; await image.decode();
    const dimensions = [image.naturalWidth, image.naturalHeight]; URL.revokeObjectURL(url);
    const evidence = [];
    for (const target of [document.querySelector('form'), ...document.querySelectorAll('section[aria-label]')]) {
      for (const type of ['paste', 'drop']) {
        const transfer = new DataTransfer(); transfer.items.add(file);
        const property = type === 'paste' ? 'clipboardData' : 'dataTransfer';
        let event;
        try { event = type === 'paste' ? new ClipboardEvent(type, { bubbles: true, cancelable: true, clipboardData: transfer })
          : new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }); }
        catch { event = new Event(type, { bubbles: true, cancelable: true }); }
        if (event[property]?.files?.[0] !== file) Object.defineProperty(event, property, { value: transfer });
        evidence.push({ type, target: target.getAttribute('aria-label') ?? 'form', count: event[property].files.length,
          typeInPayload: event[property].files[0].type, size: event[property].files[0].size,
          signature: [...new Uint8Array(await event[property].files[0].arrayBuffer())].slice(0, 8), dimensions });
        target.dispatchEvent(event);
      }
    }
    return evidence;
  });
  expect(payloads).toHaveLength(6);
  for (const payload of payloads) {
    expect(payload.count).toBe(1); expect(payload.typeInPayload).toBe('image/png'); expect(payload.size).toBeGreaterThan(0);
    expect(payload.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]); expect(payload.dimensions).toEqual([4, 3]);
  }
  expect(payloads.map(payload => payload.target)).toEqual(['form', 'form', 'Frente del DNI', 'Frente del DNI', 'Dorso del DNI', 'Dorso del DNI']);
  await expect(page.getByAltText('Frente del DNI', { exact: true })).toHaveCount(0);
  await expect(page.getByAltText('Dorso del DNI', { exact: true })).toHaveCount(0);
  await expect(page.locator('input[type=file], video, [ondrop], [onpaste]')).toHaveCount(0);
  expect(await page.evaluate(() => ({ calls: window.__dni.calls, uploads: window.__dni.uploads.length }))).toEqual({ calls: 0, uploads: 0 });
  expect(state.uploads).toBe(0);
  await takePhoto(page, 'frente', { confirm: false });
  await expect(page.getByRole('dialog').getByText(/Podés usar esta foto o volver a sacarla/)).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Usar esta foto', exact: true })).toBeEnabled();
  await page.getByRole('dialog').getByRole('button', { name: 'Usar esta foto', exact: true }).click();
  await expect(page.getByAltText('Frente del DNI', { exact: true })).toBeVisible();
});

for (const [name, overrides] of [
  ['old contextless link', { solicitudId: null, captureSessionId: null, baseRevision: null }],
  ['missing token with cookie', { token: null }],
  ['partial binding', { captureSessionId: null, baseRevision: null }],
  ['empty binding', { solicitudId: '', captureSessionId: '', baseRevision: '' }],
  ['invalid binding', { captureSessionId: 'invalid' }],
]) test(`mounted QR screen blocks ${name} before any context GET`, async ({ page }, info) => {
  const state = await installSyntheticCapture(page, { phone: isPhone(info) });
  await page.context().addCookies([{ name: 'leadToken', value: 'synthetic-cookie', url: 'http://127.0.0.1:4179' }]);
  const params = new URLSearchParams({ leadId: '42', token: 'synthetic-token', solicitudId: contextSnapshot.solicitudId,
    captureSessionId: contextSnapshot.captureSessionId, baseRevision: contextSnapshot.baseRevision });
  for (const [key, value] of Object.entries(overrides)) { if (value === null) params.delete(key); else params.set(key, value); }
  await page.goto(`/subir-dni?${params}`);
  await expect(page.getByRole('button', { name: 'Volver al registro', exact: true })).toBeVisible();
  expect(state.contextGets).toBe(0);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Escaneá con tu celular' })).toHaveCount(0);
  await expect(page.locator('video, input[type=file]')).toHaveCount(0);
  for (const button of await page.getByRole('button', { name: /^Sacar foto del/ }).all()) await expect(button).toBeDisabled();
  await page.getByRole('button', { name: 'Actualizar captura', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hablar con un asesor', exact: true })).toBeVisible();
  expect(state.contextGets).toBe(0); expect(state.uploads).toBe(0); expect(await page.evaluate(() => window.__dni.calls)).toBe(0);
});

for (const entry of ['mobile', 'inline']) test(`${entry} valid context control permits initial context access`, async ({ page }, info) => {
  const state = await installSyntheticCapture(page, { phone: isPhone(info) }); await openEntry(page, entry);
  if (isPhone(info)) await expect(page.getByRole('button', { name: 'Sacar foto del frente', exact: true })).toBeEnabled();
  else await expect(page.getByRole('img', { name: 'Escaneá con tu celular' })).toBeVisible();
  expect(state.contextGets).toBeGreaterThan(0); expect(await page.evaluate(() => window.__dni.calls)).toBe(0);
});

for (const entry of ['mobile', 'inline']) for (const [status, cause, side, label] of [
  [413, 'DNI_FILE_TOO_LARGE', 'front', 'Frente del DNI'], [413, 'DNI_FILE_TOO_LARGE', 'back', 'Dorso del DNI'],
  [422, 'DNI_IMAGE_INVALID', 'front', 'Frente del DNI'], [422, 'DNI_IMAGE_INVALID', 'back', 'Dorso del DNI'],
]) test(`${entry} visible face guidance ${cause} ${side} preserves both photos`, async ({ page }, info) => {
  test.skip(!isPhone(info)); const state = await installSyntheticCapture(page, { phone: true }); await openEntry(page, entry); await takePair(page);
  const front = page.getByAltText('Frente del DNI', { exact: true }), back = page.getByAltText('Dorso del DNI', { exact: true });
  const urls = [await front.getAttribute('src'), await back.getAttribute('src')]; state.error = { status, cause, side };
  await page.getByRole('button', { name: 'Enviar fotos', exact: true }).click(); await expect(page.getByRole('alert')).toContainText(label);
  await expect(page.getByRole('alert')).not.toContainText('PRIVATE-UPSTREAM');
  await expect(front).toHaveAttribute('src', urls[0]); await expect(back).toHaveAttribute('src', urls[1]);
  await page.getByRole('button', { name: `Volver a sacar el ${side === 'front' ? 'frente' : 'dorso'}`, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape');
  await expect(front).toHaveAttribute('src', urls[0]); await expect(back).toHaveAttribute('src', urls[1]); expect(state.uploads).toBe(1);
});





for (const frame of [wideFrame, tallFrame]) test(`confirmed previews contain every corner without overlapping (${frame.width}x${frame.height})`, async ({ page }, info) => {
  test.setTimeout(70000);
  await installSyntheticCapture(page, { phone: true, width: frame.width, height: frame.height });
  await openEntry(page, frame === wideFrame ? 'mobile' : 'inline');
  for (const side of ['frente', 'dorso']) {
    await page.getByRole('button', { name: new RegExp(`^(Sacar foto del|Volver a sacar el) ${side}$`) }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Capturar', exact: true }).click();
    const path = info.outputPath(`confirmed-${side}`);
    await expect(dialog.getByRole('button', { name: 'Usar esta foto' })).toBeVisible();
    await dialog.screenshot({ path: info.outputPath(`review-${side}.png`) });
    await expectCroppedPreview(dialog.getByRole('img'), frame);
    await dialog.getByRole('button', { name: 'Usar esta foto', exact: true }).click();
    const image = page.getByAltText(side === 'frente' ? 'Frente del DNI' : 'Dorso del DNI', { exact: true });
    await expectCroppedPreview(image, frame, `${path}.png`);
    const geometry = await image.evaluate(image => {
      const frame = image.parentElement; const viewport = frame.parentElement; const slot = viewport.parentElement;
      const bounds = node => { const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
      return { frame: bounds(frame), viewport: bounds(viewport), slotScrollHeight: slot.scrollHeight, slotClientHeight: slot.clientHeight };
    });
    expect(geometry.viewport.height + 1).toBeGreaterThanOrEqual(geometry.frame.height);
    expect(geometry.slotScrollHeight).toBeLessThanOrEqual(geometry.slotClientHeight + 1);

    await page.getByRole('button', { name: `Ver foto del ${side}`, exact: true }).click();
    await expectZoomedPreview(image, frame, path);
    await page.getByRole('button', { name: `Reducir foto del ${side}`, exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Enviar fotos', exact: true })).toBeEnabled();
  const slots = await page.locator('section[aria-label]').evaluateAll(slots => slots.map(slot => { const box = slot.getBoundingClientRect(); return { x: box.x, y: box.y, right: box.right, bottom: box.bottom }; }));
  await page.screenshot({ path: info.outputPath('thumbnails.png'), fullPage: true });
  const [front, back] = slots;
  expect(back.y >= front.bottom || back.x >= front.right).toBe(true);
});
