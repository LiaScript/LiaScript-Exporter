const puppeteer=require('puppeteer'); const fs=require('fs'); const http=require('http'); const path=require('path')
const ROOT='dist/webapp/build'
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png'}
const server=http.createServer((req,res)=>{
  let f=path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory()) f=path.join(f,'index.html')
  if(!fs.existsSync(f)){res.writeHead(404);return res.end('nope')}
  res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'})
  fs.createReadStream(f).pipe(res)
})
;(async()=>{
  await new Promise(r=>server.listen(8322,r))
  const b=await puppeteer.launch({args:['--no-sandbox']}); const p=await b.newPage()
  await p.goto('http://localhost:8322/index.html',{waitUntil:'networkidle2'})
  const md=fs.readFileSync('/tmp/claude-1000/-home-jihad-h-LiaScript-LiaScript-Exporter/00062f0d-e815-4b04-889b-f83cfa8a60d3/scratchpad/fx/course.md','utf8')
  const out=await p.evaluate(async (md)=>{
    const fd=new FormData()
    fd.append('files', new File([md],'course.md',{type:'text/markdown'}))
    fd.append('format','docx')
    const msgs=[]
    const {jobId}=await window.LiaExporter.exportFormData(fd,(m)=>msgs.push(m))
    const job=await window.LiaExporter.job(jobId)
    const u8 = job.bytes instanceof Uint8Array ? job.bytes : new Uint8Array(job.bytes)
    window.__docx=Array.from(u8)
    return {filename:job.filename, size:u8.length, msgs}
  }, md).catch(e=>({error:String(e)}))
  console.log(JSON.stringify({filename:out.filename,size:out.size,error:out.error}))
  if(out.size){ fs.writeFileSync('/tmp/claude-1000/-home-jihad-h-LiaScript-LiaScript-Exporter/00062f0d-e815-4b04-889b-f83cfa8a60d3/scratchpad/fx/out.docx', Buffer.from(await p.evaluate(()=>window.__docx))) ; console.log('saved') }
  await b.close(); server.close()
})()
