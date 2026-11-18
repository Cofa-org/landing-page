// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CameraCapture from "../../../screens/DNIUploadMobile/components/CameraCapture/CameraCapture.jsx";
import DNIUploadMobileScreen from "../../../screens/DNIUploadMobile/DNIUploadMobileScreen.jsx";
import DNIUploadStep from "../../../screens/registrationSim/components/DNIUploadStep/DNIUploadStep.jsx";
import Service from "../../../services/leadRegistrationService.js";
vi.mock("../../../services/leadRegistrationService.js",()=>({default:{obtenerContextoDni:vi.fn(),subirDniMobile:vi.fn()}}));
const context={solicitudId:"91",captureSessionId:"11111111-1111-4111-8111-111111111111",baseRevision:"a".repeat(64)};
const snapshot=(extra={})=>({success:true,data:{...context,canCapture:true,estado_onboarding:"CELULAR_VALIDADO",dniReceivedForSession:false,receivedUploadId:null,receiptKind:"none",...extra}});
const capture = { blob:new Blob(["synthetic"],{type:"image/png"}),width:1200,height:800 };
beforeEach(()=>{
 vi.clearAllMocks();
 let counter=0;URL.createObjectURL=vi.fn(()=>`blob:synthetic-${++counter}`);URL.revokeObjectURL=vi.fn();
 vi.spyOn(HTMLMediaElement.prototype,"play").mockResolvedValue();
 vi.spyOn(HTMLMediaElement.prototype,"readyState","get").mockReturnValue(4);
 vi.spyOn(HTMLVideoElement.prototype,"videoWidth","get").mockReturnValue(1200);
 vi.spyOn(HTMLVideoElement.prototype,"videoHeight","get").mockReturnValue(800);
 vi.spyOn(HTMLVideoElement.prototype,"getBoundingClientRect").mockReturnValue({width:400,height:300});
 vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue({drawImage:vi.fn()});
 vi.spyOn(HTMLCanvasElement.prototype,"toBlob").mockImplementation(callback=>callback(capture.blob));
 Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:vi.fn(async()=>({getTracks:()=>[{stop:vi.fn()}]}))}});
 Service.obtenerContextoDni.mockResolvedValue(snapshot());
});
const confirmSide=async(name)=>{
 const button=await screen.findByRole("button",{name:`Sacar foto del ${name}`});
 await waitFor(()=>expect(button).toBeEnabled());fireEvent.click(button);
 fireEvent.click(await screen.findByRole("button",{name:"Capturar"}));
 fireEvent.click(await screen.findByRole("button",{name:"Usar esta foto"}));
};
it.each([
 [413,"DNI_FILE_TOO_LARGE","front","Frente del DNI"],
 [413,"DNI_FILE_TOO_LARGE","back","Dorso del DNI"],
 [422,"DNI_IMAGE_INVALID","front","Frente del DNI"],
 [422,"DNI_IMAGE_INVALID","back","Dorso del DNI"],
 [422,"DNI_IMAGE_INVALID","PRIVATE-UPSTREAM",null],
 [413,"DNI_FILE_TOO_LARGE","__proto__",null],
])("visible %s %s guidance safely identifies %s and preserves both photos",async(status,cause,side,label)=>{
 Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:true}});
 Service.subirDniMobile.mockResolvedValue({success:false,status,cause,message:"PRIVATE-UPSTREAM",data:{side}});
 render(<DNIUploadStep leadId="42" leadToken="synthetic"/>);
 await confirmSide("frente");await confirmSide("dorso");
 const frontUrl=screen.getByAltText("Frente del DNI").getAttribute("src");
 const backUrl=screen.getByAltText("Dorso del DNI").getAttribute("src");
 fireEvent.click(screen.getByRole("button",{name:"Enviar fotos"}));
 const alert=await screen.findByRole("alert");
 if(label) expect(alert).toHaveTextContent(label);
 else expect(alert).not.toHaveTextContent(/Frente del DNI|Dorso del DNI/);
 expect(alert).not.toHaveTextContent(/PRIVATE-UPSTREAM|__proto__/);
 expect(screen.getByAltText("Frente del DNI")).toHaveAttribute("src",frontUrl);
 expect(screen.getByAltText("Dorso del DNI")).toHaveAttribute("src",backUrl);
 const recapture=screen.getByRole("button",{name:`Volver a sacar el ${side==="back"?"dorso":"frente"}`});
 expect(recapture).toBeEnabled();fireEvent.click(recapture);
 expect(screen.getByRole("dialog")).toBeVisible();fireEvent.keyDown(screen.getByRole("dialog"),{key:"Escape"});
 expect(screen.getByAltText("Frente del DNI")).toHaveAttribute("src",frontUrl);
 expect(screen.getByAltText("Dorso del DNI")).toHaveAttribute("src",backUrl);
});
it("cancelled recapture preserves the parent confirmed photo and its URL",async()=>{
 Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:true}});
 render(<DNIUploadStep leadId="42" leadToken="synthetic"/>);
 await confirmSide("frente");
 const originalUrl=screen.getByAltText("Frente del DNI").getAttribute("src");
 fireEvent.click(screen.getByRole("button",{name:"Volver a sacar el frente"}));fireEvent.click(await screen.findByRole("button",{name:"Capturar"}));
 await screen.findByRole("button",{name:"Usar esta foto"});
 fireEvent.keyDown(screen.getByRole("dialog"),{key:"Escape"});
 expect(screen.getByAltText("Frente del DNI")).toHaveAttribute("src",originalUrl);
 expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(originalUrl);
 expect(Service.subirDniMobile).not.toHaveBeenCalled();
});
it("explicit conflict refresh prepares preserved photos; separate Enviar creates next operation",async()=>{
 Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:true}});
 Service.subirDniMobile.mockResolvedValueOnce({success:false,status:409,cause:"DNI_CAPTURE_SUPERSEDED"});
 render(<DNIUploadStep leadId="42" leadToken="synthetic"/>);
 await confirmSide("frente");await confirmSide("dorso");
 fireEvent.click(screen.getByRole("button",{name:"Enviar fotos"}));
 await screen.findByRole("button",{name:"Actualizar para reintentar con estas fotos"});
 Service.obtenerContextoDni.mockResolvedValue(snapshot({baseRevision:"b".repeat(64),dniReceivedForSession:true,receiptKind:"current_session",receivedUploadId:"22222222-2222-4222-8222-222222222222",estado_onboarding:"DNI_SUBIDO"}));
 fireEvent.click(screen.getByRole("button",{name:"Actualizar para reintentar con estas fotos"}));
 await waitFor(()=>expect(screen.getByRole("button",{name:"Enviar fotos"})).toBeEnabled());
 expect(screen.getByAltText("Frente del DNI")).toBeVisible();expect(screen.getByAltText("Dorso del DNI")).toBeVisible();
 expect(Service.subirDniMobile).toHaveBeenCalledTimes(1);
 expect(screen.queryByText(/Recibimos tus fotos/)).toBeNull();
 Service.subirDniMobile.mockImplementation(async(_lead,_files,_token,_signal,_retry,options)=>({success:true,data:{...options.context,uploadId:options.uploadId,dniReceivedForSession:true,estado_onboarding:"DNI_SUBIDO",documentValidation:"not_performed"}}));
 fireEvent.click(screen.getByRole("button",{name:"Enviar fotos"}));
 await screen.findByText(/Recibimos tus fotos/);
 const first=Service.subirDniMobile.mock.calls[0][5];const second=Service.subirDniMobile.mock.calls[1][5];
 expect(second.context.baseRevision).toBe("b".repeat(64));expect(second.uploadId).not.toBe(first.uploadId);
});
it("shows a status message while the DNI photos are being processed", async () => {
 Object.defineProperty(navigator, "userAgentData", { configurable: true, value: { mobile: true } });
 let finishUpload;
 Service.subirDniMobile.mockImplementationOnce((_lead, _files, _token, _signal, _retry, options) =>
  new Promise(resolve => {
   finishUpload = () => resolve({
    success: true,
    data: { ...options.context, uploadId: options.uploadId, dniReceivedForSession: true, estado_onboarding: "DNI_SUBIDO", documentValidation: "not_performed" },
   });
  }));
 render(<DNIUploadStep leadId="42" leadToken="synthetic" />);
 await confirmSide("frente");
 await confirmSide("dorso");

 const message = "Estamos procesando tus fotos. Aguardá unos segundos.";
 expect(screen.queryByText(message)).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Enviar fotos" }));
 expect(screen.getByRole("status")).toHaveTextContent(message);

 finishUpload();
 await screen.findByText(/Recibimos tus fotos/);
 expect(screen.queryByText(message)).not.toBeInTheDocument();
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it("names dialog, starts camera, traps focus and Escape returns focus",async()=>{
 const onCancel=vi.fn();const trigger=document.createElement("button");document.body.append(trigger);trigger.focus();
 const {rerender}=render(<CameraCapture open tipoFoto="frente" onCapture={vi.fn()} onCancel={onCancel}/>);
 const dialog=screen.getByRole("dialog",{name:"Sacar foto del frente"});
 expect(dialog).toContainElement(document.activeElement);
 await screen.findByRole("button",{name:"Capturar"});
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
 const close=screen.getByRole("button",{name:"Cerrar cámara"});close.focus();fireEvent.keyDown(dialog,{key:"Tab",shiftKey:true});
 expect(screen.getByRole("button",{name:"Capturar"})).toHaveFocus();
 expect(screen.queryAllByRole("link")).toHaveLength(0);
 fireEvent.keyDown(dialog,{key:"Escape"});expect(onCancel).toHaveBeenCalledOnce();
 rerender(<CameraCapture open={false} tipoFoto="frente" onCapture={vi.fn()} onCancel={onCancel}/>);
 expect(trigger).toHaveFocus();trigger.remove();
});
it("shows the 8:5 region at both zoom levels and confirms the complete original once",async()=>{
 const onCapture=vi.fn();render(<CameraCapture open tipoFoto="dorso" onCapture={onCapture} onCancel={vi.fn()}/>);
 await screen.findByRole("button",{name:"Capturar"});
 fireEvent.click(screen.getByRole("button",{name:"Capturar"}));
 const preview=await screen.findByAltText("Foto del dorso");
 expect(screen.queryByRole("button",{name:"Hablar con un asesor"})).toBeNull();
 expect(preview.parentElement.style.aspectRatio).toBe("1.6 / 1");
 expect(preview.style.width).toBe("100%");
 expect(parseFloat(preview.style.height)).toBeCloseTo(106.6666667);
 expect(parseFloat(preview.style.top)).toBeCloseTo(-3.3333333);
 expect(screen.queryByRole("button",{name:/Girar/})).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Ampliar foto"}));expect(screen.getByRole("button",{name:"Reducir foto"})).toHaveAttribute("aria-expanded","true");
 fireEvent.click(screen.getByRole("button",{name:"Usar esta foto"}));
 expect(parseFloat(preview.style.top)).toBeCloseTo(-3.3333333);
 expect(onCapture).toHaveBeenCalledExactlyOnceWith({...capture,rotation:0,
   crop:{left:0,top:25,width:1200,height:750},captureProfile:"DNI_GUIDE_8X5_V1"});
});

it.each(["registro", "QR"])("confirms 8:5 thumbnails and sends the untouched PNG pair with guide profile through %s",async entry=>{
 Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:true}});
 const front = new Blob(["synthetic front"], {type:"image/png"});
 const back = new Blob(["synthetic back"], {type:"image/png"});
 HTMLCanvasElement.prototype.toBlob.mockImplementationOnce(callback=>callback(front)).mockImplementationOnce(callback=>callback(back));
 const query = new URLSearchParams({leadId:"42",token:"synthetic",...context});
 const {container} = render(entry === "registro" ? <DNIUploadStep leadId="42" leadToken="synthetic" />
   : <MemoryRouter initialEntries={[`/subir-dni?${query}`]}><DNIUploadMobileScreen /></MemoryRouter>);
 await confirmSide("frente");
 await confirmSide("dorso");
 const preview = screen.getByAltText("Frente del DNI");
 expect(preview.parentElement.style.aspectRatio).toBe("1.6 / 1");
 expect(parseFloat(preview.style.top)).toBeCloseTo(-3.3333333);
 fireEvent.click(screen.getByRole("button",{name:"Ampliar frente"}));
 expect(screen.getByRole("button",{name:"Reducir frente"})).toHaveAttribute("aria-expanded","true");
 expect(parseFloat(preview.style.top)).toBeCloseTo(-3.3333333);
 expect(container.querySelector('input[type="file"]')).toBeNull();
 Service.subirDniMobile.mockImplementationOnce(async(_lead,_files,_token,_signal,_retry,options)=>({success:true,data:{
   ...options.context,uploadId:options.uploadId,dniReceivedForSession:true,estado_onboarding:"DNI_SUBIDO",documentValidation:"not_performed",
 }}));
 fireEvent.click(screen.getByRole("button",{name:"Enviar fotos"}));
 await waitFor(()=>expect(Service.subirDniMobile).toHaveBeenCalledOnce());
 const [,files,,,,options] = Service.subirDniMobile.mock.calls[0];
 expect(files.dniFront).toBe(front);
 expect(files.dniBack).toBe(back);
 expect(options).toMatchObject({captureProfile:"DNI_GUIDE_8X5_V1",rotationFront:0,rotationBack:0});
});

it('shows preparation guidance only on the initial screen and opens camera directly', async () => {
 Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { mobile: true } });
 render(<DNIUploadStep leadId="42" leadToken="synthetic" />);
 expect(screen.getByText(/Sacá el DNI de la funda/)).toHaveTextContent(/mesa con luz pareja.*celular paralelo.*cuatro esquinas.*datos y códigos.*bien enfocado/);
 const opener = await screen.findByRole('button', { name: 'Sacar foto del frente' });
 await waitFor(() => expect(opener).toBeEnabled()); fireEvent.click(opener);
 expect(screen.getByRole('dialog')).not.toHaveTextContent(/Sacá el DNI de la funda/);
 await screen.findByRole('button', { name: 'Capturar' });
 expect(screen.queryByRole('button', { name: 'Activar cámara' })).toBeNull();
});
