require('dotenv').config();
const express=require('express'), mongoose=require('mongoose'), bcrypt=require('bcryptjs'), jwt=require('jsonwebtoken'), fs=require('fs'), path=require('path'), crypto=require('crypto');
const app=express(); app.use(express.json()); app.use(express.static('public'));
const secret=process.env.JWT_SECRET||crypto.randomBytes(32).toString('hex');
let connected=false;
if(process.env.MONGODB_URI) mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:8000}).then(()=>{connected=true;console.log('MongoDB Atlas connected')}).catch(e=>console.log('Atlas unavailable; demo local storage enabled:',e.message));
const User=mongoose.model('User',new mongoose.Schema({name:String,email:{type:String,unique:true},password:String,count:{type:Number,default:0}}));
const local=path.join(__dirname,'demo-users.json');
function read(){try{return JSON.parse(fs.readFileSync(local))}catch{return []}} function write(x){fs.writeFileSync(local,JSON.stringify(x,null,2))}
async function find(email){return connected?User.findOne({email}).lean():read().find(x=>x.email===email)}
app.get('/api/status',(req,res)=>res.json({database:connected?'atlas':'local-demo'}));
app.post('/api/signup',async(req,res)=>{try{let {name,email,password}=req.body;name=(name||'').trim();email=(email||'').trim().toLowerCase();if(!name||!/^\S+@\S+\.\S+$/.test(email)||!password||password.length<8)return res.status(400).json({error:'Add your name, a valid email and a password of at least 8 characters.'});if(await find(email))return res.status(409).json({error:'An account with this email already exists.'});let user={name,email,password:await bcrypt.hash(password,10),count:0};if(connected)await User.create(user);else{let a=read();a.push(user);write(a)};res.json({token:jwt.sign({email},secret,{expiresIn:'7d'}),user:{name,email,count:0}})}catch(e){res.status(500).json({error:'Could not create account. Please try again.'})}});
app.post('/api/login',async(req,res)=>{try{let email=(req.body.email||'').trim().toLowerCase(),u=await find(email);if(!u||!await bcrypt.compare(req.body.password||'',u.password))return res.status(401).json({error:'Email or password is incorrect.'});res.json({token:jwt.sign({email},secret,{expiresIn:'7d'}),user:{name:u.name,email:u.email,count:u.count||0}})}catch(e){res.status(500).json({error:'Could not sign in.'})}});
function auth(req,res,next){try{req.email=jwt.verify((req.headers.authorization||'').replace('Bearer ',''),secret).email;next()}catch{return res.status(401).json({error:'Please sign in again.'})}}
app.get('/api/me',auth,async(req,res)=>{let u=await find(req.email);if(!u)return res.status(401).end();res.json({name:u.name,email:u.email,count:u.count||0})});
app.put('/api/count',auth,async(req,res)=>{let count=Number(req.body.count);if(!Number.isSafeInteger(count)||count<0||count>10000000)return res.status(400).end();if(connected)await User.updateOne({email:req.email},{$set:{count}});else{let a=read(),u=a.find(x=>x.email===req.email);if(u){u.count=count;write(a)}}res.json({ok:true})});
const port=process.env.PORT||3000; app.listen(port,'0.0.0.0',()=>console.log('Sukoon running on port '+port));
