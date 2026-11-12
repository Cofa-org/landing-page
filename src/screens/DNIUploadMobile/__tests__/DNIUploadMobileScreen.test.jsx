// @vitest-environment jsdom
import React, { useLayoutEffect } from "react";
import { act, render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import Service from "../../../services/leadRegistrationService.js";
import DNIUploadMobileScreen from "../DNIUploadMobileScreen.jsx";
import { useDniCaptureScreen } from "../../../hooks/useDniCaptureScreen.js";
import DniCapture from "../../../Components/DniCapture/DniCapture.jsx";
import CameraCapture from "../components/CameraCapture/CameraCapture.jsx";
vi.mock("../../../services/leadRegistrationService.js",()=>({default:{obtenerContextoDni:vi.fn(),subirDniMobile:vi.fn()}}));
const context={solicitudId:"91",captureSessionId:"11111111-1111-4111-8111-111111111111",baseRevision:"a".repeat(64)};
const renderScreen=(params={leadId:"42",token:"synthetic",...context})=>render(<MemoryRouter initialEntries={["/subir-dni?"+new URLSearchParams(params)]}><DNIUploadMobileScreen/></MemoryRouter>);
beforeEach(()=>{
 vi.clearAllMocks();Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:false}});
 Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:vi.fn()}});
 Service.obtenerContextoDni.mockResolvedValue({success:true,data:{...context,canCapture:true,estado_onboarding:"CELULAR_VALIDADO",dniReceivedForSession:false,receiptKind:"none",receivedUploadId:null}});
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it.each([
 ["old phone link",true,{leadId:"42",token:"synthetic"}],
 ["old desktop link",false,{leadId:"42",token:"synthetic"}],
 ["missing token with cookie",true,{leadId:"42",...context}],
 ["empty token",false,{leadId:"42",token:"",...context}],
 ["blank token",true,{leadId:"42",token:"  ",...context}],
 ["invalid lead",true,{leadId:"042",token:"synthetic",...context}],
 ["partial binding",true,{leadId:"42",token:"synthetic",solicitudId:"91"}],
 ["empty binding",true,{leadId:"42",token:"synthetic",solicitudId:"",captureSessionId:"",baseRevision:""}],
 ["invalid solicitud",true,{leadId:"42",token:"synthetic",...context,solicitudId:"091"}],
 ["invalid session",false,{leadId:"42",token:"synthetic",...context,captureSessionId:"invalid"}],
 ["invalid revision",true,{leadId:"42",token:"synthetic",...context,baseRevision:"A".repeat(64)}],
])("actual QR route blocks %s before context access and retains safe recovery",async(_label,phone,params)=>{
 Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:phone}});
 document.cookie="leadToken=synthetic-cookie; path=/";
 try {
  const {container}=renderScreen(params);
  await act(async()=>{});
  expect(Service.obtenerContextoDni).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.queryByTitle("Escaneá con tu celular")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
  for(const button of screen.queryAllByRole("button",{name:/Sacar foto del/})) expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole("button",{name:"Actualizar captura"}));
  await waitFor(()=>expect(screen.getByRole("alert")).toBeVisible());
  expect(Service.obtenerContextoDni).not.toHaveBeenCalled();
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  expect(Service.subirDniMobile).not.toHaveBeenCalled();
  expect(screen.getByRole("button",{name:"Volver al registro"})).toBeVisible();
  expect(screen.getByRole("button",{name:"Hablar con un asesor"})).toBeVisible();
  expect(container.querySelector('input[type="file"]')).toBeNull();
 } finally { document.cookie="leadToken=; max-age=0; path=/"; }
});
it("direct desktop URL remains handoff despite webcam and touch",async()=>{
 window.matchMedia=vi.fn(()=>({matches:true}));const {container}=renderScreen();
 await screen.findByTitle("Escaneá con tu celular");
 expect(container.querySelectorAll('a[href*="/subir-dni?"]').length).toBe(0);
 expect(container.querySelector('input[type="file"]')).toBeNull();fireEvent.submit(container.querySelector("form"));
 expect(Service.subirDniMobile).not.toHaveBeenCalled();expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
});
it("phone route composes same camera, cancellation preserves existing capture flow",async()=>{
 Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:true}});
 const {container}=renderScreen();fireEvent.click(await screen.findByRole("button",{name:"Sacar foto del dorso"}));
 expect(screen.getByRole("dialog",{name:"Sacar foto del dorso"})).toBeVisible();
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
 fireEvent.keyDown(screen.getByRole("dialog"),{key:"Escape"});expect(screen.queryByRole("dialog")).toBeNull();
 expect(container.querySelector('input[type="file"]')).toBeNull();
});
it("phone route keeps only camera recovery after permission denial",async()=>{
 Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:true}});
 navigator.mediaDevices.getUserMedia.mockRejectedValue(new DOMException("PRIVATE-CANARY","NotAllowedError"));
 const {container}=renderScreen();
 fireEvent.click(await screen.findByRole("button",{name:"Sacar foto del frente"}));
 await screen.findByRole("button",{name:"Reintentar cámara"});
 expect(container.querySelector('input[type="file"]')).toBeNull();
 expect(screen.queryByText("PRIVATE-CANARY")).toBeNull();
 expect(screen.getAllByRole("button", { name:"Hablar con un asesor" }).length).toBeGreaterThan(0);
 expect(screen.queryAllByRole("link")).toHaveLength(0);
 expect(Service.subirDniMobile).not.toHaveBeenCalled();
});

// Exercise the real screen model + dialog + frame encoder; only browser media
// and the remote metadata boundary are synthetic.
function BoundCaptureHarness({ binding, onSnapshot, onLayout }) {
 const capture = useDniCaptureScreen(binding);
 useLayoutEffect(() => { onSnapshot(capture); onLayout?.(); });
 return <><DniCapture viewModel={capture.viewModel}/><CameraCapture {...capture.cameraProps}/></>;
}
const bindingA={leadId:"42",token:"synthetic-A",expectedContext:context};
const bindingB={leadId:"43",token:"synthetic-B",expectedContext:{
 solicitudId:"92",captureSessionId:"33333333-3333-4333-8333-333333333333",baseRevision:"b".repeat(64),
}};
const syntheticFrame={blob:new Blob(["synthetic-PNG"],{type:"image/png"}),width:1200,height:800,rotation:0};
const metadataFor=bound=>({success:true,data:{...bound.expectedContext,canCapture:true,estado_onboarding:"CELULAR_VALIDADO",dniReceivedForSession:false,receivedUploadId:null,receiptKind:"none"}});
const prepareRealCamera=()=>{
 Object.defineProperty(navigator,"userAgentData",{configurable:true,value:{mobile:true}});
 const stop=vi.fn();
 navigator.mediaDevices.getUserMedia.mockResolvedValue({getTracks:()=>[{stop}]});
 vi.spyOn(HTMLMediaElement.prototype,"play").mockResolvedValue();
 vi.spyOn(HTMLMediaElement.prototype,"readyState","get").mockReturnValue(4);
 vi.spyOn(HTMLVideoElement.prototype,"videoWidth","get").mockReturnValue(1200);
 vi.spyOn(HTMLVideoElement.prototype,"videoHeight","get").mockReturnValue(800);
 URL.createObjectURL=vi.fn(()=>`blob:binding-${URL.createObjectURL.mock.calls.length}`);
 URL.revokeObjectURL=vi.fn();
 return stop;
};
const openAndEncode=async(encode)=>{
 const open=await screen.findByRole("button",{name:"Sacar foto del frente"});
 await waitFor(()=>expect(open).toBeEnabled());fireEvent.click(open);
 const shutter=await screen.findByRole("button",{name:"Capturar"});
 const video=document.querySelector("video");
 Object.defineProperties(video,{videoWidth:{value:1200},videoHeight:{value:800},readyState:{value:2}});
 const canvas=document.querySelector("canvas");
 canvas.getContext=()=>({drawImage:vi.fn()});
 canvas.toBlob=encode;
 fireEvent.click(shutter);
};
it.each([
 ["lead/session",bindingB],
 ["token",{...bindingA,token:"synthetic-refreshed"}],
 ["expected revision",{...bindingA,expectedContext:{...context,baseRevision:"c".repeat(64)}}],
])("discards real dialog candidate when %s binding changes and rejects its old confirmation",async(_label,nextBinding)=>{
 const stop=prepareRealCamera();let current;
 Service.obtenerContextoDni.mockResolvedValue(metadataFor(bindingA));
 const onSnapshot=capture=>{current=capture;};
 const {rerender}=render(<BoundCaptureHarness binding={bindingA} onSnapshot={onSnapshot}/>);
 await openAndEncode(callback=>callback(syntheticFrame.blob));
 const oldPreview=await screen.findByAltText("Foto del frente");
 const oldUrl=oldPreview.getAttribute("src");const oldConfirm=current.cameraProps.onCapture;
 Service.obtenerContextoDni.mockResolvedValue(metadataFor(nextBinding));
 rerender(<BoundCaptureHarness binding={nextBinding} onSnapshot={onSnapshot}/>);
 await waitFor(()=>expect(screen.getByRole("button",{name:"Sacar foto del frente"})).toBeEnabled());
 expect(screen.queryByRole("dialog")).toBeNull();
 expect(URL.revokeObjectURL).toHaveBeenCalledWith(oldUrl);expect(stop).toHaveBeenCalledOnce();
 act(()=>oldConfirm(syntheticFrame));
 expect(screen.queryByAltText("Frente del DNI")).toBeNull();
 expect(screen.queryByAltText("Dorso del DNI")).toBeNull();
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole("button",{name:"Sacar foto del frente"}));
 await screen.findByRole("button",{name:"Capturar"});
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
});
it("invalidates a pending real frame across expected-revision rebind and releases its tracks",async()=>{
 const stop=prepareRealCamera();let finish;let current;
 const onSnapshot=capture=>{current=capture;};
 Service.obtenerContextoDni.mockResolvedValue(metadataFor(bindingA));
 const {rerender}=render(<BoundCaptureHarness binding={bindingA} onSnapshot={onSnapshot}/>);
 await openAndEncode(callback=>{finish=callback;});
 const oldConfirm=current.cameraProps.onCapture;
 const revised={...bindingA,expectedContext:{...context,baseRevision:"c".repeat(64)}};
 Service.obtenerContextoDni.mockResolvedValue(metadataFor(revised));
 rerender(<BoundCaptureHarness binding={revised} onSnapshot={onSnapshot}/>);
 await waitFor(()=>expect(screen.getByRole("button",{name:"Sacar foto del frente"})).toBeEnabled());
 expect(stop).toHaveBeenCalledOnce();
 expect(screen.queryByRole("dialog")).toBeNull();
 await act(async()=>{finish(syntheticFrame.blob);});
 act(()=>oldConfirm(syntheticFrame));
 expect(screen.queryByRole("dialog")).toBeNull();expect(screen.queryByAltText("Frente del DNI")).toBeNull();
 expect(stop).toHaveBeenCalledOnce();expect(URL.createObjectURL).not.toHaveBeenCalled();
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
});
it("rejects old binding callback during layout before passive model/dialog cleanup",async()=>{
 prepareRealCamera();let current;const onSnapshot=capture=>{current=capture;};
 Service.obtenerContextoDni.mockResolvedValue(metadataFor(bindingA));
 const {rerender}=render(<BoundCaptureHarness binding={bindingA} onSnapshot={onSnapshot}/>);
 await openAndEncode(callback=>callback(syntheticFrame.blob));await screen.findByAltText("Foto del frente");
 const oldConfirm=current.cameraProps.onCapture;const createdBefore=URL.createObjectURL.mock.calls.length;
 let callsAfterLayout;let invoked=false;
 Service.obtenerContextoDni.mockResolvedValue(metadataFor(bindingB));
 const onLayout=()=>{if(invoked)return;invoked=true;oldConfirm(syntheticFrame);callsAfterLayout=URL.createObjectURL.mock.calls.length;};
 rerender(<BoundCaptureHarness binding={bindingB} onSnapshot={onSnapshot} onLayout={onLayout}/>);
 expect(callsAfterLayout).toBe(createdBefore);
 await waitFor(()=>expect(screen.getByRole("button",{name:"Sacar foto del frente"})).toBeEnabled());
 expect(screen.queryByAltText("Frente del DNI")).toBeNull();
});
it("rejects a cancelled generation callback after reopening the same binding",async()=>{
 prepareRealCamera();let current;const onSnapshot=capture=>{current=capture;};
 Service.obtenerContextoDni.mockResolvedValue(metadataFor(bindingA));
 render(<BoundCaptureHarness binding={bindingA} onSnapshot={onSnapshot}/>);
 await openAndEncode(callback=>callback(syntheticFrame.blob));await screen.findByAltText("Foto del frente");
 const oldConfirm=current.cameraProps.onCapture;
 fireEvent.keyDown(screen.getByRole("dialog"),{key:"Escape"});
 fireEvent.click(screen.getByRole("button",{name:"Sacar foto del frente"}));
 act(()=>oldConfirm(syntheticFrame));
 expect(screen.queryByAltText("Frente del DNI")).toBeNull();
 await screen.findByRole("button",{name:"Capturar"});
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
 expect(URL.createObjectURL).toHaveBeenCalledOnce();
});
