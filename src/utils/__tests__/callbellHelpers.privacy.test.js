// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { openCallbellWebchat } from "../callbellHelpers.js";
afterEach(()=>{document.body.innerHTML="";vi.restoreAllMocks();vi.useRealTimers();});
it("never logs chat DOM or raw thrown content",()=>{
 vi.useFakeTimers();const warn=vi.spyOn(console,"warn").mockImplementation(()=>{});const error=vi.spyOn(console,"error").mockImplementation(()=>{});
 document.body.innerHTML='<div id="callbell-livechat-host"><span>PRIVATE-DNI-CANARY</span></div>';
 openCallbellWebchat();vi.runAllTimers();expect(JSON.stringify([...warn.mock.calls,...error.mock.calls])).not.toContain("PRIVATE-DNI-CANARY");
 document.getElementById("callbell-livechat-host").innerHTML='<button>chat</button>';
 document.querySelector("button").click=()=>{throw new Error("PRIVATE-DNI-CANARY");};openCallbellWebchat();
 expect(JSON.stringify([...warn.mock.calls,...error.mock.calls])).not.toContain("PRIVATE-DNI-CANARY");
});
