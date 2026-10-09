import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
try{
  const envText=await fs.readFile(path.join(root,'.env'),'utf8');
  for(const line of envText.split(/\r?\n/)){
    const match=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
  }
}catch{}
const port=Number(process.env.PORT||3000);
const model=process.env.OPENAI_MODEL||'gpt-5-mini';
const apiKey=process.env.OPENAI_API_KEY;
const questionBank=JSON.parse(await fs.readFile(path.join(root,'data','question-bank.json'),'utf8'));

const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const send=(res,status,payload)=>{res.writeHead(status,headers);res.end(JSON.stringify(payload));};
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,120);

async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>1_000_000)throw Error('Request too large')}return data?JSON.parse(data):{};}

function localQuestions(domain,type){
  const clean=normalize(domain).toLowerCase();
  const tagged=questionBank.filter(q=>q.domain===type||q.domain===clean||clean.includes(q.domain));
  if(tagged.length>=5)return tagged.slice(0,5);
  const topic=normalize(domain)||type||'this role';
  return [
    [`What are the most important fundamentals of ${topic}?`,['fundamental','principle','concept',topic.toLowerCase()]],
    [`Describe a real project where you used ${topic}.`,['project','used','problem','result',topic.toLowerCase()]],
    [`How would you troubleshoot a difficult problem in ${topic}?`,['troubleshoot','debug','approach','problem',topic.toLowerCase()]],
    [`What trade-offs should someone consider when working with ${topic}?`,['trade-off','performance','cost','maintain',topic.toLowerCase()]],
    [`How do you keep your ${topic} knowledge current?`,['learn','documentation','practice','community',topic.toLowerCase()]]
  ].map(([question,keywords])=>({question,keywords}));
}

function localEvaluate(question,answer){
  const text=String(answer||'').trim().toLowerCase();
  const words=text.split(/\s+/).filter(Boolean);
  const keywords=question?.keywords||[];
  const hits=keywords.filter(k=>text.includes(k)).length;
  const structure=/because|first|then|finally|for example|result|situation|action/i.test(text)?20:0;
  const relevance=Math.min(45,hits*12);
  const detail=Math.min(30,Math.round(words.length/2));
  const score=Math.min(100,Math.max(0,relevance+structure+detail));
  return {score,feedback:score>=78?'Strong answer — clear, relevant, and supported with useful detail.':score>=50?'Good foundation — add a specific example and make the result clearer.':'Keep practicing — use a simple structure, explain your thinking, and include an example.',strengths:score>=60?['Relevant points were included']:['You attempted the question'],improvements:score>=70?['Make the outcome even more specific']:['Use situation → action → result','Add a concrete example'],words,hits};
}

async function openAI(input,textFormat){
  if(!apiKey) return null;
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,input,text:{format:textFormat}})});
  if(!response.ok)throw Error(`OpenAI request failed (${response.status})`);
  const json=await response.json();
  const output=json.output_text||json.output?.flatMap(item=>item.content||[]).find(item=>item.text)?.text;
  if(!output)throw Error('OpenAI returned no structured output');
  return JSON.parse(output);
}

async function getQuestions(payload){
  const domain=normalize(payload.domain)||normalize(payload.type)||'general interview';
  const local=localQuestions(domain,payload.type);
  if(!apiKey||payload.useAI===false)return {questions:local,source:'local-dataset'};
  const ai=await openAI([{role:'system',content:'You create practical interview questions. Return exactly five questions that are relevant to the requested domain and difficulty. Avoid duplicates and avoid trivia.'},{role:'user',content:`Domain: ${domain}\nLevel: ${normalize(payload.level)||'early career'}\nCreate five interview questions.`}],{type:'json_schema',name:'interview_questions',strict:true,schema:{type:'object',additionalProperties:false,properties:{questions:{type:'array',minItems:5,maxItems:5,items:{type:'object',additionalProperties:false,properties:{question:{type:'string'},keywords:{type:'array',items:{type:'string'}}},required:['question','keywords']}}},required:['questions']}});
  return {questions:ai.questions,source:'ai'};
}

async function evaluate(payload){
  const fallback=localEvaluate({keywords:payload.keywords||[]},payload.answer);
  if(!apiKey||payload.useAI===false)return {...fallback,source:'local'};
  const ai=await openAI([{role:'system',content:'You are a fair interview coach. Evaluate the candidate answer against the question. Score each dimension from 0 to 100. Do not judge accent, identity, or voice quality; evaluate only the transcript content.'},{role:'user',content:`Domain: ${normalize(payload.domain)}\nQuestion: ${normalize(payload.question)}\nCandidate answer: ${String(payload.answer||'').slice(0,8000)}`}],{type:'json_schema',name:'interview_evaluation',strict:true,schema:{type:'object',additionalProperties:false,properties:{score:{type:'integer',minimum:0,maximum:100},relevance:{type:'integer',minimum:0,maximum:100},structure:{type:'integer',minimum:0,maximum:100},detail:{type:'integer',minimum:0,maximum:100},feedback:{type:'string'},strengths:{type:'array',items:{type:'string'}},improvements:{type:'array',items:{type:'string'}}},required:['score','relevance','structure','detail','feedback','strengths','improvements']}});
  return {...ai,source:'ai'};
}

const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
async function serveStatic(req,res){
  let requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(requested==='/')requested='/index.html';
  const file=path.resolve(root,'.'+requested);const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative))return send(res,403,{error:'Forbidden'});
  try{const content=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(content)}catch{send(res,404,{error:'Not found'})}
}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(req.method==='POST'&&url.pathname==='/api/questions'){send(res,200,await getQuestions(await body(req)));return;}
    if(req.method==='POST'&&url.pathname==='/api/evaluate'){send(res,200,await evaluate(await body(req)));return;}
    if(req.method==='GET'&&url.pathname==='/api/health'){send(res,200,{ok:true,aiConfigured:Boolean(apiKey),model});return;}
    if(req.method==='GET')return serveStatic(req,res);
    send(res,405,{error:'Method not allowed'});
  }catch(error){send(res,500,{error:error.message||'Server error'});}
});
server.listen(port,()=>console.log(`Prepwise running at http://localhost:${port} · AI ${apiKey?'enabled':'fallback mode'}`));
