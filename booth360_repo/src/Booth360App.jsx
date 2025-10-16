import React, { useEffect, useRef, useState } from "react";
export default function Booth360App(){
  const videoEl=useRef(null), canvasEl=useRef(null), overlayCanvasEl=useRef(null);
  const mediaRecorderRef=useRef(null), recordedChunksRef=useRef([]), rafRef=useRef(0), streamRef=useRef(null);
  const [isReady,setIsReady]=useState(false),[isRecording,setIsRecording]=useState(false),[countdown,setCountdown]=useState(0);
  const [durationSec,setDurationSec]=useState(8),[facingMode,setFacingMode]=useState('environment');
  const [devices,setDevices]=useState([]),[deviceId,setDeviceId]=useState(''),[torchOn,setTorchOn]=useState(false);
  const [resultURL,setResultURL]=useState(''),[mimeType,setMimeType]=useState('');
  const [title,setTitle]=useState('Cotillón Xpress 360'); const [subtitle,setSubtitle]=useState('Eventos • Plataforma 360°');
  const [accentColor,setAccentColor]=useState('#00e0ff'); const [logoDataURL,setLogoDataURL]=useState('');
  const supportedMime=()=>{const c=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4;codecs=h264,aac','video/mp4'];for(const m of c){if(window.MediaRecorder&&MediaRecorder.isTypeSupported(m))return m;}return '';};
  useEffect(()=>{(async()=>{try{await initCamera();await enumerateCams();setMimeType(supportedMime());setIsReady(true);}catch(e){console.error(e);alert('Permite la cámara')}})();return()=>{cancelAnimationFrame(rafRef.current);if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop());}},[]);
  useEffect(()=>{fetch('/logo.png').then(r=>r.blob()).then(b=>{const fr=new FileReader();fr.onload=()=>setLogoDataURL(fr.result);fr.readAsDataURL(b);}).catch(()=>{});},[]);
  async function enumerateCams(){const all=await navigator.mediaDevices.enumerateDevices();const cams=all.filter(d=>d.kind==='videoinput');setDevices(cams);if(!deviceId&&cams[0])setDeviceId(cams[0].deviceId);}
  async function initCamera(customId){if(!navigator.mediaDevices?.getUserMedia)throw new Error('no getUserMedia');if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop());const constraints=customId?{video:{deviceId:{exact:customId}},audio:false}:{video:{facingMode},audio:false};const stream=await navigator.mediaDevices.getUserMedia(constraints);streamRef.current=stream;if(videoEl.current){videoEl.current.srcObject=stream;await videoEl.current.play();}const [track]=stream.getVideoTracks();const caps=track.getCapabilities?.()||{};if(!caps.torch)setTorchOn(false);}
  async function toggleTorch(){try{const [track]=streamRef.current.getVideoTracks();const caps=track.getCapabilities?.();if(!caps?.torch)return alert('Sin linterna');await track.applyConstraints({advanced:[{torch:!torchOn}]});setTorchOn(v=>!v);}catch(e){alert('No pude activar linterna');}}
  function drawLoop(){const video=videoEl.current,canvas=canvasEl.current,overlayCanvas=overlayCanvasEl.current;if(!video||!canvas||!overlayCanvas)return;const W=720,H=1280;canvas.width=W;canvas.height=H;overlayCanvas.width=W;overlayCanvas.height=H;const ctx=canvas.getContext('2d'),octx=overlayCanvas.getContext('2d');const render=()=>{const vw=video.videoWidth,vh=video.videoHeight;if(vw&&vh){const target=W/H,src=vw/vh;let sx=0,sy=0,sw=vw,sh=vh;if(src>target){const nw=vh*target;sx=(vw-nw)/2;sw=nw;}else{const nh=vw/target;sy=(vh-nh)/2;sh=nh;}ctx.drawImage(video,sx,sy,sw,sh,0,0,W,H);}octx.clearRect(0,0,W,H);octx.lineWidth=24;octx.strokeStyle=accentColor;octx.globalAlpha=.7;octx.strokeRect(12,12,W-24,H-24);octx.globalAlpha=1;octx.fillStyle='#fff';octx.textAlign='center';octx.font='700 44px system-ui,sans-serif';octx.fillText(title,W/2,80);octx.font='500 28px system-ui,sans-serif';octx.fillText(subtitle,W/2,120);if(logoDataURL){const img=new Image();img.src=logoDataURL;img.onload=()=>{const lw=220,lh=(img.height/img.width)*lw;octx.drawImage(img,W-lw-24,H-lh-24,lw,lh);};}ctx.drawImage(overlayCanvas,0,0);rafRef.current=requestAnimationFrame(render);};render();}
  async function prepareMixedStream(){drawLoop();return canvasEl.current.captureStream(30);}
  async function startCountdownAndRecord(){if(isRecording)return;setResultURL('');for(let n=3;n>=1;n--){setCountdown(n);try{navigator.vibrate?.(120);}catch{}await new Promise(r=>setTimeout(r,1000));}setCountdown(0);const stream=await prepareMixedStream();const options=mimeType?{mimeType}:undefined;const mr=new MediaRecorder(stream,options);mediaRecorderRef.current=mr;recordedChunksRef.current=[];mr.ondataavailable=e=>{if(e.data?.size>0)recordedChunksRef.current.push(e.data)};mr.onstop=handleStop;mr.start();setIsRecording(true);setTimeout(()=>{try{mr.stop()}catch{}},durationSec*1000);}
  async function handleStop(){cancelAnimationFrame(rafRef.current);setIsRecording(false);const blob=new Blob(recordedChunksRef.current,{type:mimeType||'video/webm'});setResultURL(URL.createObjectURL(blob));}
  function download(){if(!resultURL)return;const a=document.createElement('a');a.href=resultURL;a.download=`cotillonxpress-360-${Date.now()}.${(mimeType.includes('mp4')?'mp4':'webm')}`;a.click();}
  async function share(){if(!resultURL)return;const res=await fetch(resultURL);const blob=await res.blob();const file=new File([blob],`video-360.${(mimeType.includes('mp4')?'mp4':'webm')}`,{type:blob.type});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Video 360',text:'Tu video 360 listo 🎉'});}else{download();}}
  function onLogoChange(e){const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>setLogoDataURL(reader.result);reader.readAsDataURL(f);}
  return (<div style={{minHeight:'100vh',background:'#0b0b0f',color:'#fff',display:'flex',justifyContent:'center'}}>
    <div style={{width:'100%',maxWidth:430,padding:16,display:'grid',gap:12}}>
      <h1 style={{fontSize:22,fontWeight:700}}>Booth 360 – Cámara + Overlay</h1>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <button onClick={()=>initCamera(deviceId)} style={{padding:8,borderRadius:14,background:'#1f1f26'}}>Reiniciar cámara</button>
        <button onClick={toggleTorch} style={{padding:8,borderRadius:14,background: torchOn? '#b45309':'#1f1f26'}}>{torchOn? 'Linterna ON':'Linterna OFF'}</button>
        <div style={{gridColumn:'1 / -1'}}><label style={{fontSize:12}}>Duración (s): {durationSec}</label><input type="range" min={4} max={20} value={durationSec} onChange={e=>setDurationSec(+e.target.value)} style={{width:'100%'}}/></div>
        <div style={{gridColumn:'1 / -1'}}><label style={{fontSize:12}}>Cámara</label><select onChange={async e=>{await initCamera(e.target.value)}} style={{width:'100%',padding:8,borderRadius:10,background:'#15151a',color:'#fff'}}>{devices.map(d=>(<option key={d.deviceId} value={d.deviceId}>{d.label||'Cámara'}</option>))}</select></div>
      </div>
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',boxShadow:'0 6px 30px rgba(0,0,0,.4)'}}>
        <video ref={videoEl} playsInline muted style={{position:'absolute',inset:0,width:0,height:0}}/>
        <canvas ref={canvasEl} style={{width:'100%',aspectRatio:'9/16',background:'#000'}}/>
        <canvas ref={overlayCanvasEl} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>
        {countdown>0 && (<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(0,0,0,.4)',fontSize:64,fontWeight:800}}>{countdown}</div>)}
        {isRecording && (<div style={{position:'absolute',top:8,right:8,display:'flex',gap:8,background:'rgba(220,0,0,.8)',padding:'6px 10px',borderRadius:9999}}><span style={{width:8,height:8,borderRadius:9999,background:'#fff'}}/>REC</div>)}
      </div>
      <div style={{background:'#18181f',padding:12,borderRadius:16,display:'grid',gap:8}}>
        <div><label style={{fontSize:12}}>Título</label><input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%',padding:10,borderRadius:12,background:'#0e0e12',color:'#fff'}}/></div>
        <div><label style={{fontSize:12}}>Subtítulo</label><input value={subtitle} onChange={e=>setSubtitle(e.target.value)} style={{width:'100%',padding:10,borderRadius:12,background:'#0e0e12',color:'#fff'}}/></div>
        <div><label style={{fontSize:12}}>Color acento</label><input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)} style={{height:40,width:80,borderRadius:8}}/></div>
        <div><label style={{fontSize:12}}>Logo PNG (opcional)</label><input type="file" accept="image/*" onChange={onLogoChange}/></div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={startCountdownAndRecord} disabled={!isReady||isRecording} style={{flex:1,padding:12,borderRadius:16,background:'#10b981',opacity:(!isReady||isRecording)?0.6:1}}>Grabar {durationSec}s</button>
        <button onClick={()=>{setFacingMode(p=>p==='environment'?'user':'environment');initCamera();}} style={{padding:12,borderRadius:16,background:'#1f1f26'}}>Flip</button>
      </div>
      {resultURL && (<div style={{background:'#18181f',padding:12,borderRadius:16,display:'grid',gap:8}}>
        <video src={resultURL} controls style={{width:'100%',borderRadius:12}}/>
        <div style={{display:'flex',gap:8}}>
          <button onClick={download} style={{flex:1,padding:10,borderRadius:14,background:'#0284c7'}}>Descargar</button>
          <button onClick={async()=>share()} style={{flex:1,padding:10,borderRadius:14,background:'#6d28d9'}}>Compartir</button>
        </div></div>)}
    </div></div>);}