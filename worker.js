// Optional Cloudflare Worker. Requires secrets OPENAI_API_KEY and APP_TOKEN,
// and environment variable ALLOWED_ORIGIN (your exact hosted web-app origin).
// OpenAI API usage may cost money. Never place OPENAI_API_KEY in the browser.
export default {async fetch(request, env) {
  const origin=request.headers.get('Origin')||'';
  const cors={'Access-Control-Allow-Origin':origin===env.ALLOWED_ORIGIN?origin:'null','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:cors});
  if(origin!==env.ALLOWED_ORIGIN)return new Response('Origin not allowed',{status:403,headers:cors});
  if(!env.APP_TOKEN||request.headers.get('Authorization')!=='Bearer '+env.APP_TOKEN)return new Response('Unauthorized',{status:401,headers:cors});
  if(!env.OPENAI_API_KEY)return new Response('Missing AI configuration',{status:503,headers:cors});
  const raw=await request.text();if(raw.length>12_000_000)return new Response('Payload too large',{status:413,headers:cors});
  let body;try{body=JSON.parse(raw)}catch{return new Response('Invalid JSON',{status:400,headers:cors})}
  if(!Array.isArray(body.images)||body.images.length<1||body.images.length>8||body.images.some(x=>typeof x!=='string'||!x.startsWith('data:image/jpeg;base64,')))return new Response('Invalid photos',{status:400,headers:cors});
  const content=[{type:'text',text:'Analyze these resale item photos together. Produce a single accurate listing title and description suitable for eBay, Depop, and Mercari. Return JSON only with string fields: title, description, brand, size, color, category, condition, material, tags, uncertain. Mention only visual evidence, never invent measurements, materials, size, brand, or condition. Use uncertain for missing details to verify. Never include any pricing, currency, or price suggestions. Title <= 80 characters. Do not claim authenticity.'},...body.images.map(url=>({type:'image_url',image_url:{url,detail:'low'}}))];
  try{
    const ai=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.OPENAI_API_KEY},body:JSON.stringify({model:'gpt-4o-mini',temperature:0.2,response_format:{type:'json_object'},messages:[{role:'user',content}],max_tokens:900})});
    if(!ai.ok)return new Response('AI provider error: '+ai.status,{status:502,headers:cors});
    const result=await ai.json();let parsed=JSON.parse(result.choices?.[0]?.message?.content||'{}');
    const allowed=['title','description','brand','size','color','category','condition','material','tags','uncertain'];const safe={};for(const key of allowed)safe[key]=typeof parsed[key]==='string'?parsed[key]:'';
    return new Response(JSON.stringify(safe),{headers:{...cors,'Content-Type':'application/json'}});
  }catch{return new Response('AI analysis failed',{status:502,headers:cors})}
}};
