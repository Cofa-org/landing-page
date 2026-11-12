// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CameraCapture from "../../../screens/DNIUploadMobile/components/CameraCapture/CameraCapture.jsx";
import { useCameraCapture } from "../../../screens/DNIUploadMobile/hooks/useCameraCapture.js";
import DNIUploadStep from "../../../screens/registrationSim/components/DNIUploadStep/DNIUploadStep.jsx";
import Service from "../../../services/leadRegistrationService.js";
vi.mock("../../../screens/DNIUploadMobile/hooks/useCameraCapture.js", () => ({ useCameraCapture:vi.fn() }));
vi.mock("../../../services/leadRegistrationService.js",()=>({default:{obtenerContextoDni:vi.fn(),subirDniMobile:vi.fn()}}));
const context={solicitudId:"91",captureSessionId:"11111111-1111-4111-8111-111111111111",baseRevision:"a".repeat(64)};
const snapshot=(extra={})=>({success:true,data:{...context,canCapture:true,estado_onboarding:"CELULAR_VALIDADO",dniReceivedForSession:false,receivedUploadId:null,receiptKind:"none",...extra}});
const capture = { blob:new Blob(["synthetic"],{type:"image/png"}),width:1200,height:800 };
beforeEach(()=>{
 vi.clearAllMocks();
 let counter=0;URL.createObjectURL=vi.fn(()=>`blob:synthetic-${++counter}`);URL.revokeObjectURL=vi.fn();
 HTMLMediaElement.prototype.play=vi.fn().mockResolvedValue();
 useCameraCapture.mockReturnValue({stream:null,isStarting:false,error:"",startCamera:vi.fn().mockResolvedValue({}),stopCamera:vi.fn(),captureFrame:vi.fn().mockResolvedValue(capture)});
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
afterEach(cleanup);
it("names dialog, starts camera, traps focus and Escape returns focus",async()=>{
 const onCancel=vi.fn();const trigger=document.createElement("button");document.body.append(trigger);trigger.focus();
 const {rerender}=render(<CameraCapture open tipoFoto="frente" onCapture={vi.fn()} onCancel={onCancel}/>);
 const dialog=screen.getByRole("dialog",{name:"Sacar foto del frente"});
 expect(dialog).toContainElement(document.activeElement);
 await screen.findByRole("button",{name:"Capturar"});
 expect(useCameraCapture().startCamera).toHaveBeenCalledOnce();
 const close=screen.getByRole("button",{name:"Cerrar cámara"});close.focus();fireEvent.keyDown(dialog,{key:"Tab",shiftKey:true});
 expect(screen.getByRole("button",{name:"Hablar con un asesor"})).toHaveFocus();
 expect(screen.queryAllByRole("link")).toHaveLength(0);
 fireEvent.keyDown(dialog,{key:"Escape"});expect(onCancel).toHaveBeenCalledOnce();
 rerender(<CameraCapture open={false} tipoFoto="frente" onCapture={vi.fn()} onCancel={onCancel}/>);
 expect(trigger).toHaveFocus();trigger.remove();
});
it("shows full frame, rotation and zoom then confirms once with no preview URL",async()=>{
 const onCapture=vi.fn();render(<CameraCapture open tipoFoto="dorso" onCapture={onCapture} onCancel={vi.fn()}/>);
 await screen.findByRole("button",{name:"Capturar"});
 fireEvent.click(screen.getByRole("button",{name:"Capturar"}));
 const preview=await screen.findByAltText("Foto del dorso");
 expect(preview.parentElement.style.aspectRatio).toBe("1.5 / 1");
 fireEvent.click(screen.getByRole("button",{name:"Girar 90°"}));
 expect(preview.style.transform).toContain("rotate(90deg)");
 expect(preview.parentElement.style.aspectRatio).toBe("0.6666666666666666 / 1");
 fireEvent.click(screen.getByRole("button",{name:"Ampliar foto"}));expect(screen.getByRole("button",{name:"Reducir foto"})).toHaveAttribute("aria-expanded","true");
 fireEvent.click(screen.getByRole("button",{name:"Usar esta foto"}));
 expect(onCapture).toHaveBeenCalledExactlyOnceWith({...capture,rotation:90});
});

it('shows preparation guidance only on the initial screen and opens camera directly', async () => {
 Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { mobile: true } });
 render(<DNIUploadStep leadId="42" leadToken="synthetic" />);
 expect(screen.getByText(/Sacá el DNI de la funda/)).toHaveTextContent(/luz pareja.*cuatro esquinas.*datos y códigos.*bien enfocado/);
 const opener = await screen.findByRole('button', { name: 'Sacar foto del frente' });
 await waitFor(() => expect(opener).toBeEnabled()); fireEvent.click(opener);
 expect(screen.getByRole('dialog')).not.toHaveTextContent(/Sacá el DNI de la funda/);
 await screen.findByRole('button', { name: 'Capturar' });
 expect(screen.queryByRole('button', { name: 'Activar cámara' })).toBeNull();
});
