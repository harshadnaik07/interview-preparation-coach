let recognition=null;
let recordingRequested=false;

function startVoice(){
  const button=document.getElementById('voiceBtn');
  const status=document.getElementById('voiceStatus');
  const answer=document.getElementById('answer');
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){status.textContent='Voice input is not supported in this browser. Type your answer instead.';return;}
  if(recognition){
    recordingRequested=false;
    recognition.stop();
    return;
  }

  // Keep the answer already typed or recorded and append this recording to it.
  const existingAnswer=answer.value.trim();
  let sessionTranscript='';
  recordingRequested=true;
  button.textContent='■ Stop recording';
  button.classList.add('recording');
  status.textContent='Listening… recording will continue until you stop it.';

  function createRecognition(){
    recognition=new SpeechRecognition();
    recognition.lang='en-US';
    recognition.continuous=true;
    recognition.interimResults=true;
    recognition.onresult=e=>{
      let finalText='';let interimText='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const transcript=e.results[i][0].transcript;
        if(e.results[i].isFinal) finalText+=transcript+' '; else interimText+=transcript;
      }
      sessionTranscript+=(finalText||'');
      const combined=(sessionTranscript+interimText).trim();
      answer.value=existingAnswer+(existingAnswer&&combined?' ':'')+combined;
    };
    recognition.onerror=e=>{if(e.error!=='aborted')status.textContent='Voice input had a problem. You can keep typing or try recording again.'};
    recognition.onend=()=>{
      recognition=null;
      if(recordingRequested){
        // Some browsers stop recognition after a short silence even in continuous mode.
        // Restart automatically while the user still wants to record.
        setTimeout(()=>{if(recordingRequested)createRecognition()},150);
        return;
      }
      button.textContent='● Record answer';
      button.classList.remove('recording');
      status.textContent='Transcript ready — review it before submitting.';
    };
    recognition.start();
  }
  createRecognition();
}
window.startVoice=startVoice;
