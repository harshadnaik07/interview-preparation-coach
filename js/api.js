async function getInterviewQuestions(setup){
  const response=await fetch('/api/questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({domain:setup.domain,type:setup.type,level:setup.level})});
  if(!response.ok)throw Error('Question service unavailable');
  return response.json();
}

async function evaluateInterviewAnswer(payload){
  const response=await fetch('/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!response.ok)throw Error('Evaluation service unavailable');
  return response.json();
}
window.getInterviewQuestions=getInterviewQuestions;window.evaluateInterviewAnswer=evaluateInterviewAnswer;
