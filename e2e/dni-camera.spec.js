import { test, expect } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import qrcodeReact from 'qrcode.react';
import { writeFile } from 'node:fs/promises';
import { contextSnapshot, installSyntheticCapture, openEntry, takePhoto, takePair } from './fixtures/dni-camera.js';

const { QRCodeSVG } = qrcodeReact;
const isPhone = info => info.project.name.endsWith('-phone');

test.afterEach(async ({ page }) => { await expect(page.locator('a[href*="/subir-dni?"], a[href*="wa.me"]')).toHaveCount(0); await page.close(); await page.context().unrouteAll({ behavior: 'ignoreErrors' }); });

test('desktop touch/webcam only offers context-bound scannable QR', async ({ page }, info) => {
  test.skip(isPhone(info));
  await installSyntheticCapture(page, { phone: false });
  await openEntry(page);
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
});

for (const entry of ['mobile', 'inline']) test(`${entry} captures original PNG pair without persistent image data or console disclosure`, async ({ page }, info) => {
  test.skip(!isPhone(info));
  const consoleMessages = [];
  page.on('console', message => consoleMessages.push(message.text()));
  await installSyntheticCapture(page, { phone: true }); await openEntry(page, entry);
  await takePair(page);
  await expect(page.locator('input[type=file], [ondrop], [onpaste]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Enviar fotos', exact: true }).click();
  await expect(page.getByText(/Recibimos tus fotos/)).toBeVisible();
  const upload = await page.evaluate(() => window.__dni.uploads[0]);
  expect(upload.files).toHaveLength(2);
  for (const file of upload.files) { expect(file.type).toBe('image/png'); expect(file.bytes.slice(0, 8)).toEqual([137,80,78,71,13,10,26,10]); expect(Buffer.from(file.bytes).readUInt32BE(16)).toBe(1600); expect(Buffer.from(file.bytes).readUInt32BE(20)).toBe(1200); }
  expect(upload.fields).toMatchObject({ solicitudId: '81', captureSessionId: contextSnapshot.captureSessionId, baseRevision: contextSnapshot.baseRevision, rotationFront: '0', rotationBack: '0' });
  expect(upload.fields.uploadId).toMatch(/^[a-f0-9-]{36}$/);
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toMatch(/data:image|blob:|base64|PRUEBA SIN VALIDEZ/);
  expect(consoleMessages.join('\n')).not.toMatch(/synthetic-token|PRIVATE-UPSTREAM|base64|blob:|a1234567/);
});

for (const portrait of [false, true]) test(`actual preview geometry all rotations, zoom, corners, focus (${portrait ? 'portrait' : 'landscape'})`, async ({ page }, info) => {
  await installSyntheticCapture(page, { phone: true, width: portrait ? 1200 : 1600, height: portrait ? 1600 : 1200 });
  await openEntry(page); const opener = page.getByRole('button', { name: 'Sacar foto del frente', exact: true });
  await opener.click(); const dialog = page.getByRole('dialog'); const close = dialog.getByRole('button', { name: 'Cerrar cámara' });
  await expect(close).toBeFocused(); await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button', { name: 'Hablar con un asesor', exact: true })).toBeFocused(); await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await dialog.getByRole('button', { name: 'Activar cámara', exact: true }).click(); await dialog.getByRole('button', { name: 'Capturar', exact: true }).click();
  await expect(dialog.getByRole('img')).toBeVisible();
  await expect.poll(() => dialog.getByRole('img').evaluate(image => image.naturalWidth)).toBe(portrait ? 1200 : 1600);
  const geometry = [];
  for (const rotation of [0,90,180,270]) {
    const image = dialog.getByRole('img');
    const boxes = await image.evaluate(img => { const r=img.getBoundingClientRect(); const f=img.parentElement.getBoundingClientRect(); return { image: { x:r.x,y:r.y,width:r.width,height:r.height }, frame: { x:f.x,y:f.y,width:f.width,height:f.height }, natural: [img.naturalWidth,img.naturalHeight] }; });
    expect(Math.abs(boxes.image.width-boxes.frame.width)).toBeLessThan(1);
    expect(Math.abs(boxes.image.height-boxes.frame.height)).toBeLessThan(1);
    expect(boxes.natural).toEqual(portrait ? [1200,1600] : [1600,1200]); geometry.push({ rotation, ...boxes });
    await image.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`${info.project.name}-${portrait ? 'portrait' : 'landscape'}-${rotation}.png`), fullPage: true });
    await dialog.getByRole('button', { name: 'Ampliar foto', exact: true }).click();
    const scroll = dialog.locator('[data-expanded=true]');
    expect(await scroll.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    for (const corner of ['left','right']) { await scroll.evaluate((el,corner) => { el.scrollLeft = corner === 'left' ? 0 : el.scrollWidth; }, corner); await scroll.screenshot({ path: info.outputPath(`${info.project.name}-${portrait ? 'portrait' : 'landscape'}-${rotation}-zoom-${corner}.png`) }); }
    await dialog.getByRole('button', { name: 'Reducir foto', exact: true }).click();
    await dialog.getByRole('button', { name: 'Girar 90°', exact: true }).click();
  }
  await writeFile(info.outputPath(`${info.project.name}-${portrait ? 'portrait' : 'landscape'}-geometry.json`), JSON.stringify(geometry,null,2));
  const targets = await dialog.locator('button,a').evaluateAll(nodes => nodes.filter(node=>node.getClientRects().length).map(node => ({ name:node.textContent, height:node.getBoundingClientRect().height, width:node.getBoundingClientRect().width })));
  expect(targets.every(target=>target.height>=44 && target.width>=44)).toBe(true);
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for (const [status,cause] of [[400,'DNI_CAPTURE_INVALID_INPUT'],[401,'DNI_SESSION_EXPIRED'],[403,'DNI_FORBIDDEN'],[404,'DNI_CAPTURE_NOT_FOUND'],[409,'DNI_CAPTURE_CONTEXT_REQUIRED'],[409,'DNI_CAPTURE_CONTEXT_CHANGED'],[409,'DNI_CAPTURE_SUPERSEDED'],[409,'DNI_CAPTURE_STEP_UNAVAILABLE'],[413,'DNI_FILE_TOO_LARGE'],[413,'DNI_IMAGE_LIMIT'],[415,'DNI_IMAGE_UNSUPPORTED'],[422,'DNI_IMAGE_INVALID'],[429,'DNI_UPLOAD_BUSY'],[503,'DNI_IMAGE_TIMEOUT'],[503,'DNI_STORAGE_UNAVAILABLE'],[503,'DNI_CAPTURE_SAVE_FAILED'],[502,'DNI_TECHNICAL_ERROR']]) test(`safe ${status} ${cause} preserves previews without file fallback`, async ({ page }, info) => {
  test.skip(!isPhone(info)); const state = await installSyntheticCapture(page,{phone:true}); await openEntry(page); await takePair(page);
  state.error = {status,cause,side:status===422?'back':null}; await page.getByRole('button',{name:'Enviar fotos',exact:true}).click();
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByRole('alert')).not.toContainText('PRIVATE-UPSTREAM');
  await expect(page.getByAltText('Frente del DNI',{exact:true})).toBeVisible(); await expect(page.getByAltText('Dorso del DNI',{exact:true})).toBeVisible(); await expect(page.locator('input[type=file]')).toHaveCount(0);
  expect(state.uploads).toBe(1);
});

for (const failure of ['network','html','legacy200']) test(`transport ${failure} explicit retry keeps operation`,async({page},info)=>{
  test.skip(!isPhone(info)); const state=await installSyntheticCapture(page,{phone:true}); await openEntry(page); await takePair(page);
  state.error=failure==='network'?'network':failure==='html'?{html:true}:{httpStatus:200,status:503,cause:'DNI_STORAGE_UNAVAILABLE'};
  await page.getByRole('button',{name:'Enviar fotos',exact:true}).click(); await expect(page.getByRole('alert')).toBeVisible();
  state.error=null; await page.getByRole('button',{name:'Enviar fotos',exact:true}).click(); await expect(page.getByText(/Recibimos tus fotos/)).toBeVisible();
  const uploads=await page.evaluate(()=>window.__dni.uploads); expect(uploads[0].fields.uploadId).toBe(uploads[1].fields.uploadId);
});

test('permission late, no frame, null blob, late play rejection and cancelled retake release safely',async({page},info)=>{
  test.skip(!isPhone(info)); await installSyntheticCapture(page,{phone:true}); await openEntry(page);
  await page.getByRole('button',{name:'Sacar foto del frente',exact:true}).click(); await page.evaluate(()=>window.__dni.late=true);
  await page.getByRole('dialog').getByRole('button',{name:'Activar cámara',exact:true}).click(); await page.keyboard.press('Escape');
  await page.evaluate(()=>{ window.__dni.resolvePermission(); window.__dni.late=false; }); await expect.poll(()=>page.evaluate(()=>window.__dni.stopped)).toBe(1);
  for(const mode of ['noFrame','nullBlob']) {
    await page.getByRole('button',{name:'Sacar foto del frente',exact:true}).click(); await page.evaluate(mode=>window.__dni[mode]=true,mode);
    await page.getByRole('dialog').getByRole('button',{name:'Activar cámara',exact:true}).click(); await page.getByRole('dialog').getByRole('button',{name:'Capturar',exact:true}).click(); await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible(); await page.keyboard.press('Escape'); await page.evaluate(mode=>window.__dni[mode]=false,mode);
  }
  await page.evaluate(()=>window.__dni.latePlay=true); await takePhoto(page,'frente',{confirm:false}); await page.evaluate(()=>window.__dni.rejectPlay(new Error('synthetic late'))); await expect(page.getByRole('dialog').getByRole('img')).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Usar esta foto',exact:true}).click();
  const url=await page.getByAltText('Frente del DNI',{exact:true}).getAttribute('src');
  await page.getByRole('button',{name:'Volver a sacar el frente',exact:true}).click(); await page.keyboard.press('Escape'); expect(await page.getByAltText('Frente del DNI',{exact:true}).getAttribute('src')).toBe(url);
});

for(const error of ['NotAllowedError','NotFoundError','NotReadableError','OverconstrainedError','unsupported']) test(`camera ${error} safe alternatives without file input`,async({page},info)=>{
  test.skip(!isPhone(info)); await installSyntheticCapture(page,{phone:true}); await openEntry(page);
  await page.evaluate(error=>{ if(error==='unsupported') Object.defineProperty(navigator,'mediaDevices',{value:{},configurable:true}); else window.__dni.error=error; },error);
  await page.getByRole('button',{name:'Sacar foto del frente',exact:true}).click(); await page.getByRole('dialog').getByRole('button',{name:'Activar cámara',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible(); await expect(page.getByRole('dialog').getByRole('button',{name:'Hablar con un asesor',exact:true})).toBeVisible(); await expect(page.locator('a')).toHaveCount(0); await expect(page.locator('input[type=file]')).toHaveCount(0);
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
  state.error=null; await page.getByRole('button',{name:'Enviar fotos',exact:true}).click(); await expect(page.getByText(/Recibimos tus fotos/)).toBeVisible();
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
  await expect(page.getByText(/Recibimos tus fotos/)).toBeVisible(); expect(state.uploads).toBe(1);
});

test('binding change while permission pending releases old work and requires a fresh camera action', async ({ page }, info) => {
  test.skip(!isPhone(info));
  const state = await installSyntheticCapture(page, { phone: true }); await openEntry(page);
  await page.evaluate(() => window.__dni.late = true);
  await page.getByRole('button', { name: 'Sacar foto del frente', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Activar cámara', exact: true }).click();
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
]) test(`actual QR boundary blocks ${name} before any context GET`, async ({ page }, info) => {
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





for (const portrait of [false, true]) test(`confirmed parent previews contain every corner without shrinking or overlapping (${portrait ? 'portrait' : 'landscape'})`, async ({ page }, info) => {
  test.setTimeout(70000);
  await installSyntheticCapture(page, { phone: true, width: portrait ? 1200 : 1600, height: portrait ? 1600 : 1200 });
  await openEntry(page);
  for (const rotation of [0, 90, 180, 270]) {
    for (const side of ['frente', 'dorso']) {
      await page.getByRole('button', { name: new RegExp(`^(Sacar foto del|Volver a sacar el) ${side}$`) }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'Activar cámara', exact: true }).click();
      await dialog.getByRole('button', { name: 'Capturar', exact: true }).click();
      await expect.poll(() => dialog.getByRole('img').evaluate(image => image.naturalWidth)).toBe(portrait ? 1200 : 1600);
      for (let turn = 0; turn < rotation / 90; turn++) await dialog.getByRole('button', { name: 'Girar 90°', exact: true }).click();
      await dialog.getByRole('button', { name: 'Usar esta foto', exact: true }).click();
      const image = page.getByAltText(side === 'frente' ? 'Frente del DNI' : 'Dorso del DNI', { exact: true });
      await expect.poll(() => image.evaluate(image => image.naturalWidth)).toBe(portrait ? 1200 : 1600);
      const geometry = await image.evaluate(image => {
        const frame = image.parentElement; const viewport = frame.parentElement; const slot = viewport.parentElement;
        const bounds = node => { const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
        return { image: bounds(image), frame: bounds(frame), viewport: bounds(viewport), slot: bounds(slot), slotScrollHeight: slot.scrollHeight, slotClientHeight: slot.clientHeight };
      });
      expect(geometry.viewport.height + 1).toBeGreaterThanOrEqual(geometry.frame.height);
      expect(geometry.slotScrollHeight).toBeLessThanOrEqual(geometry.slotClientHeight + 1);
      expect(Math.abs(geometry.image.width - geometry.frame.width)).toBeLessThan(1);
      expect(Math.abs(geometry.image.height - geometry.frame.height)).toBeLessThan(1);

      const name = `${info.project.name}-parent-${portrait ? 'portrait' : 'landscape'}-${side}-${rotation}`;
      await image.locator('..').screenshot({ path: info.outputPath(`${name}.png`) });
      await page.getByRole('button', { name: `Ampliar ${side}`, exact: true }).click();
      const viewport = image.locator('../..');
      expect(await viewport.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
      for (const corner of ['left', 'right']) {
        await viewport.evaluate((node, corner) => { node.scrollLeft = corner === 'left' ? 0 : node.scrollWidth; }, corner);
        await viewport.screenshot({ path: info.outputPath(`${name}-zoom-${corner}.png`) });
      }
      await page.getByRole('button', { name: `Reducir ${side}`, exact: true }).click();
    }
  }
  await expect(page.getByRole('button', { name: 'Enviar fotos', exact: true })).toBeEnabled();
  const slots = await page.locator('section[aria-label]').evaluateAll(slots => slots.map(slot => { const box = slot.getBoundingClientRect(); return { x: box.x, y: box.y, right: box.right, bottom: box.bottom }; }));
  const [front, back] = slots;
  expect(back.y >= front.bottom || back.x >= front.right).toBe(true);
});
