const interviewQuestions={
  hr:[['Walk me through your background and the work you are most proud of.',['background','experience','project','skills']],['Tell me about a time you handled a difficult challenge.',['situation','action','result','learn']],['Why are you interested in this role?',['role','company','skills','growth']],['Tell me about a time you disagreed with a teammate.',['disagree','listen','team','solution']],['What would your previous manager say is your biggest strength?',['strength','feedback','example','impact']]],
  frontend:[['How would you build a responsive, accessible web page?',['responsive','semantic','accessibility','mobile']],['Explain the difference between state and props in a UI application.',['state','props','component','data']],['Tell me about a front-end project and a trade-off you made.',['project','users','performance','trade-off']],['How would you improve the performance of a slow web page?',['performance','network','cache','lazy']],['How do you test a user interface before shipping it?',['test','user','browser','automation']]],
  data:[['How would you explain a data insight to a non-technical stakeholder?',['insight','business','visual','simple']],['What is the difference between correlation and causation?',['relationship','cause','experiment','data']],['Describe a project where you cleaned or prepared messy data.',['missing','duplicate','validation','pipeline']],['How would you measure whether a model or analysis is successful?',['metric','baseline','measure','business']],['Tell me about a time your data changed a decision.',['data','decision','insight','impact']]],
  python:[['What makes Python useful for building software and data tools?',['language','readable','library','automation']],['When would you use a list, tuple, set, or dictionary?',['collection','mutable','unique','key']],['Explain how you would make a Python function easier to test.',['function','input','output','test']],['How would you diagnose a slow Python program?',['profile','performance','memory','algorithm']],['What is a clean way to handle errors in a Python application?',['error','exception','handle','logging']]]
};

function getQuestionsForDomain(domain,type){
  const clean=(domain||'').trim();
  if(!clean) return interviewQuestions[type]||interviewQuestions.hr;
  const known=Object.keys(interviewQuestions).find(key=>clean.toLowerCase().includes(key));
  if(known) return interviewQuestions[known];
  const topic=clean.replace(/\s+/g,' ');
  return [
    [`What are the most important fundamentals of ${topic}?`,['fundamental','principle','concept',topic.toLowerCase()]],
    [`Describe a real project where you used ${topic}.`,['project','used','problem','result',topic.toLowerCase()]],
    [`How would you troubleshoot a difficult problem in ${topic}?`,['troubleshoot','debug','approach','problem',topic.toLowerCase()]],
    [`What trade-offs should someone consider when working with ${topic}?`,['trade-off','performance','cost','maintain',topic.toLowerCase()]],
    [`How do you keep your ${topic} knowledge current?`,['learn','documentation','practice','community',topic.toLowerCase()]]
  ];
}
window.interviewQuestions=interviewQuestions;window.getQuestionsForDomain=getQuestionsForDomain;
